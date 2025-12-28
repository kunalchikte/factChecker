const axios = require("axios");
const fs = require("fs");
const path = require("path");

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

// Model selection for multimodal (video/audio) support
// Available models: gemini-1.5-flash-latest, gemini-1.5-pro-latest, gemini-2.0-flash-exp
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

console.log(`[Gemini] Using model: ${GEMINI_MODEL}`);

/**
 * Builds the optimized prompt for information extraction and verification
 * Uses directive language instead of "fact-check" to avoid safety filter issues
 */
const buildExtractionPrompt = (isTranscript = true) => {
	const contentType = isTranscript ? "transcript" : "video";
	return `Task: Extract and verify factual claims from this ${contentType}.

Instructions:
1. Watch/read the content carefully and identify ALL specific factual statements.
2. Focus on hard data: dates, statistics, names, historical facts, scientific claims, numbers.
3. Ignore pure opinions (e.g., "X is bad/good").
4. For speculative claims (like celebrity gossip), list them and mark as 'SPECULATIVE'.
5. Use your knowledge to verify each claim. Mark as CORRECT, INCORRECT, or SPECULATIVE.
6. Extract AT LEAST 3-10 claims. If content has fewer verifiable facts, extract what's available.

Response Format (STRICT JSON, no markdown):
{
  "summary": "Brief content summary (max 100 words)",
  "videoTopic": "Main topic in 5 words",
  "totalClaims": 0,
  "correctClaims": [
    {"claim": "Exact statement from content", "reasoning": "Why verified as correct", "confidence": "HIGH/MEDIUM/LOW"}
  ],
  "incorrectClaims": [
    {"claim": "Exact statement from content", "reasoning": "Why this is wrong/misleading", "confidence": "HIGH/MEDIUM/LOW"}
  ],
  "speculativeClaims": [
    {"claim": "Unverifiable statement", "reasoning": "Why this cannot be verified", "confidence": "LOW"}
  ],
  "correctPercentage": 0,
  "incorrectPercentage": 0,
  "speculativePercentage": 0,
  "trustScore": 0,
  "trustLevel": "HIGH/MEDIUM/LOW",
  "analysisNote": "Brief methodology note"
}

Rules:
- trustScore: 0-100 (based on correct claims ratio, penalize incorrect claims heavily)
- trustLevel: HIGH (75-100), MEDIUM (40-74), LOW (0-39)
- Percentages must add up to 100
- ALWAYS extract claims - never return empty arrays unless content has zero factual statements
- Be specific in reasoning (cite sources if known)`;
};

/**
 * Common generation config with relaxed safety settings
 */
const getGenerationConfig = () => ({
	temperature: 0.2,
	topK: 40,
	topP: 0.9,
	maxOutputTokens: 4096,
	responseMimeType: "application/json"
});

/**
 * Relaxed safety settings to avoid over-filtering
 */
const getSafetySettings = () => [
	{ category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
	{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
	{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
	{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
];

/**
 * Analyzes transcript text using Gemini (FAST method - ~5-15 seconds)
 */
exports.analyzeTranscript = async (transcript) => {
	try {
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey) {
			return { status: 500, msg: "Gemini API key not configured", data: null };
		}

		console.log(`[Gemini] Analyzing transcript (${transcript.length} chars) with ${GEMINI_MODEL}...`);
		const startTime = Date.now();

		// Truncate very long transcripts to save tokens and speed up
		let processedTranscript = transcript;
		if (transcript.length > 30000) {
			processedTranscript = transcript.substring(0, 30000) + "... [truncated for speed]";
			console.log(`[Gemini] Transcript truncated to 30000 chars`);
		}

		const prompt = buildExtractionPrompt(true);
		const fullPrompt = `${prompt}\n\nCONTENT TO ANALYZE:\n"""\n${processedTranscript}\n"""`;

		const requestBody = {
			contents: [{ parts: [{ text: fullPrompt }] }],
			generationConfig: getGenerationConfig(),
			safetySettings: getSafetySettings()
			// Note: googleSearch tool cannot be used with responseMimeType: "application/json"
		};

		const response = await axios.post(
			`${GEMINI_API_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
			requestBody,
			{ headers: { "Content-Type": "application/json" }, timeout: 60000 }
		);

		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`[Gemini] Analysis complete in ${elapsed}s`);

		return parseGeminiResponse(response);

	} catch (error) {
		return handleGeminiError(error);
	}
};

/**
 * Analyzes video/audio using Gemini File API (SLOW method - optimized)
 * @param {string} filePath - Path to the media file
 * @param {string} fileName - Name of the file
 * @param {string} mimeType - MIME type of the file (e.g., video/mp4, audio/mp4)
 */
exports.analyzeVideo = async (filePath, fileName, mimeType = "video/mp4") => {
	let geminiFileName = null;

	try {
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey) {
			return { status: 500, msg: "Gemini API key not configured", data: null };
		}

		const startTime = Date.now();

		// Step 1: Upload video/audio
		console.log(`[Gemini] Uploading media to Gemini (${mimeType})...`);
		const uploadStart = Date.now();
		const uploadResult = await uploadVideoToGemini(filePath, fileName, apiKey, mimeType);
		
		if (uploadResult.status !== 200) {
			return uploadResult;
		}

		geminiFileName = uploadResult.data.fileName;
		console.log(`[Gemini] Upload complete in ${((Date.now() - uploadStart) / 1000).toFixed(1)}s: ${geminiFileName}`);

		// Step 2: Wait for processing (reduced polling interval for speed)
		console.log(`[Gemini] Waiting for video processing...`);
		const processStart = Date.now();
		const processingResult = await waitForFileProcessing(geminiFileName, apiKey);
		
		if (processingResult.status !== 200) {
			await deleteGeminiFile(geminiFileName, apiKey);
			return processingResult;
		}
		console.log(`[Gemini] Video ready in ${((Date.now() - processStart) / 1000).toFixed(1)}s`);

		// Step 3: Analyze video
		console.log(`[Gemini] Analyzing video content with ${GEMINI_MODEL}...`);
		const analysisStart = Date.now();
		const prompt = buildExtractionPrompt(false);

		const requestBody = {
			contents: [{
				parts: [
					{ fileData: { mimeType: mimeType, fileUri: uploadResult.data.fileUri } },
					{ text: prompt }
				]
			}],
			generationConfig: getGenerationConfig(),
			safetySettings: getSafetySettings()
			// Note: googleSearch tool cannot be used with responseMimeType: "application/json"
		};

		const response = await axios.post(
			`${GEMINI_API_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
			requestBody,
			{ headers: { "Content-Type": "application/json" }, timeout: 180000 }
		);

		console.log(`[Gemini] Analysis complete in ${((Date.now() - analysisStart) / 1000).toFixed(1)}s`);

		// Step 4: Cleanup
		await deleteGeminiFile(geminiFileName, apiKey);

		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`[Gemini] Total video processing: ${elapsed}s`);

		return parseGeminiResponse(response);

	} catch (error) {
		if (geminiFileName) {
			await deleteGeminiFile(geminiFileName, process.env.GEMINI_API_KEY);
		}
		return handleGeminiError(error);
	}
};

/**
 * Uploads a video/audio file to Gemini File API
 */
const uploadVideoToGemini = async (filePath, fileName, apiKey, mimeType = "video/mp4") => {
	try {
		const fileBuffer = fs.readFileSync(filePath);
		const fileSize = fs.statSync(filePath).size;

		console.log(`[Gemini] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB, Type: ${mimeType}`);

		// Initialize resumable upload
		const initResponse = await axios.post(
			`${GEMINI_API_BASE}/upload/v1beta/files?key=${apiKey}`,
			{ file: { display_name: fileName } },
			{
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Upload-Protocol": "resumable",
					"X-Goog-Upload-Command": "start",
					"X-Goog-Upload-Header-Content-Length": fileSize,
					"X-Goog-Upload-Header-Content-Type": mimeType
				}
			}
		);

		const uploadUrl = initResponse.headers["x-goog-upload-url"];
		if (!uploadUrl) throw new Error("Failed to get upload URL");

		// Upload the file
		const uploadResponse = await axios.put(uploadUrl, fileBuffer, {
			headers: {
				"Content-Type": mimeType,
				"Content-Length": fileSize,
				"X-Goog-Upload-Command": "upload, finalize",
				"X-Goog-Upload-Offset": 0
			},
			maxBodyLength: Infinity,
			maxContentLength: Infinity
		});

		const fileData = uploadResponse.data.file;
		console.log(`[Gemini] Upload response:`, JSON.stringify({
			name: fileData.name,
			uri: fileData.uri,
			state: fileData.state,
			mimeType: fileData.mimeType
		}));

		return {
			status: 200,
			msg: "File uploaded",
			data: {
				fileUri: fileData.uri,
				fileName: fileData.name,
				mimeType: fileData.mimeType,
				state: fileData.state
			}
		};

	} catch (error) {
		const errorMsg = error.response?.data?.error?.message || error.message;
		console.error(`[Gemini] Upload error:`, errorMsg);
		if (error.response?.data) {
			console.error(`[Gemini] Upload error details:`, JSON.stringify(error.response.data));
		}
		return { status: 500, msg: `Failed to upload video: ${errorMsg}`, data: null };
	}
};

/**
 * Waits for file to be processed by Gemini (optimized polling)
 */
const waitForFileProcessing = async (fileName, apiKey) => {
	const maxAttempts = 60;
	const delayMs = 3000; // 3 seconds between polls
	let consecutiveErrors = 0;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await axios.get(
				`${GEMINI_API_BASE}/v1beta/${fileName}?key=${apiKey}`,
				{ 
					timeout: 30000,
					headers: {
						"Accept": "application/json",
						"Content-Type": "application/json"
					},
					// Don't auto-transform, handle manually
					responseType: "text"
				}
			);

			// Try to parse the response
			let data;
			try {
				data = JSON.parse(response.data);
			} catch (parseError) {
				// Log the actual response for debugging
				const rawResponse = typeof response.data === 'string' 
					? response.data.substring(0, 500) 
					: JSON.stringify(response.data).substring(0, 500);
				console.log(`[Gemini] Non-JSON response (attempt ${attempt}): ${rawResponse}`);
				console.log(`[Gemini] Response status: ${response.status}, headers:`, response.headers['content-type']);
				
				consecutiveErrors++;
				
				if (consecutiveErrors >= 5) {
					return { status: 500, msg: "Gemini returning invalid responses. Check API key and quotas.", data: rawResponse };
				}
				
				await new Promise(resolve => setTimeout(resolve, delayMs));
				continue;
			}

			// Reset error counter on successful parse
			consecutiveErrors = 0;

			const state = data.state;
			
			if (attempt % 5 === 0 || state === "ACTIVE") {
				console.log(`[Gemini] Processing status: ${state} (attempt ${attempt}/${maxAttempts})`);
			}

			if (state === "ACTIVE") {
				return { status: 200, msg: "File ready", data: data };
			}

			if (state === "FAILED") {
				console.log(`[Gemini] File processing failed:`, data);
				return { status: 500, msg: "File processing failed by Gemini", data: data };
			}

			// State is PROCESSING, continue polling
			await new Promise(resolve => setTimeout(resolve, delayMs));

		} catch (error) {
			consecutiveErrors++;
			const errorMsg = error.response?.data?.error?.message || error.message;
			console.log(`[Gemini] Status check error (attempt ${attempt}): ${errorMsg}`);
			
			// If it's a 404, the file doesn't exist
			if (error.response?.status === 404) {
				return { status: 404, msg: "File not found in Gemini", data: null };
			}
			
			// For consecutive errors, give up after 5
			if (consecutiveErrors >= 5) {
				return { status: 500, msg: `Failed to check file status: ${errorMsg}`, data: null };
			}
			
			// Wait and retry
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}
	}

	return { status: 408, msg: "File processing timeout", data: null };
};

/**
 * Deletes a file from Gemini
 */
const deleteGeminiFile = async (fileName, apiKey) => {
	try {
		await axios.delete(`${GEMINI_API_BASE}/v1beta/${fileName}?key=${apiKey}`);
		console.log(`[Gemini] Deleted file: ${fileName}`);
	} catch (error) {
		console.error(`[Gemini] Failed to delete file: ${error.message}`);
	}
};

/**
 * Parses Gemini API response
 */
const parseGeminiResponse = (response) => {
	if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
		const textResponse = response.data.candidates[0].content.parts[0].text;

		try {
			const parsedData = JSON.parse(textResponse);
			
			// Ensure speculativeClaims exists
			if (!parsedData.speculativeClaims) {
				parsedData.speculativeClaims = [];
			}
			
			return { status: 200, msg: "Analysis complete", data: parsedData };
		} catch (parseError) {
			// Try to extract JSON
			const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				try {
					const parsedData = JSON.parse(jsonMatch[0]);
					if (!parsedData.speculativeClaims) {
						parsedData.speculativeClaims = [];
					}
					return { status: 200, msg: "Analysis complete", data: parsedData };
				} catch (e) {
					// Fall through
				}
			}
			console.error(`[Gemini] Parse error. Raw response:`, textResponse.substring(0, 500));
			return { status: 500, msg: "Failed to parse response", data: { rawResponse: textResponse.substring(0, 1000) } };
		}
	}

	if (response.data?.candidates?.[0]?.finishReason === "SAFETY") {
		return { status: 400, msg: "Content blocked due to safety concerns", data: null };
	}

	console.error(`[Gemini] Unexpected response:`, JSON.stringify(response.data).substring(0, 500));
	return { status: 500, msg: "Unexpected response from Gemini", data: null };
};

/**
 * Handles Gemini API errors
 */
const handleGeminiError = (error) => {
	console.error(`[Gemini] Error:`, error.response?.data?.error?.message || error.message);

	if (error.response) {
		return {
			status: error.response.status,
			msg: error.response.data?.error?.message || "Gemini API error",
			data: null
		};
	}

	if (error.code === "ECONNABORTED") {
		return { status: 408, msg: "Request timeout", data: null };
	}

	return { status: 500, msg: "Failed to connect to Gemini API", data: error.message };
};
