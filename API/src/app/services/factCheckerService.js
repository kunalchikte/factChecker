const youtubeService = require("./youtubeService");
const geminiService = require("./geminiService");

/**
 * Formats the fact check response for frontend consumption
 */
const formatResponse = (analysisData, videoId, originalUrl, metadata = {}) => {
	const correctClaims = analysisData.correctClaims || [];
	const incorrectClaims = analysisData.incorrectClaims || [];
	const speculativeClaims = analysisData.speculativeClaims || [];
	const totalClaims = correctClaims.length + incorrectClaims.length + speculativeClaims.length;

	return {
		video: {
			id: videoId,
			url: originalUrl,
			title: metadata.videoTitle || "Unknown Title",
			topic: analysisData.videoTopic || "Unknown Topic",
			durationSeconds: metadata.durationSeconds || 0
		},
		summary: analysisData.summary || "",
		factCheck: {
			totalClaims: totalClaims,
			correctClaims: correctClaims,
			incorrectClaims: incorrectClaims,
			speculativeClaims: speculativeClaims,
			correctPercentage: analysisData.correctPercentage || 0,
			incorrectPercentage: analysisData.incorrectPercentage || 0,
			speculativePercentage: analysisData.speculativePercentage || 0
		},
		trust: {
			score: analysisData.trustScore || 0,
			level: analysisData.trustLevel || "UNKNOWN"
		},
		analysisNote: analysisData.analysisNote || "",
		method: metadata.method || "unknown",
		processingTime: metadata.processingTime || "unknown"
	};
};

/**
 * Analyzes a YouTube video for fact checking
 * Uses hybrid approach: transcript first (fast), video fallback (slow)
 * @param {string} youtubeUrl - The YouTube video URL
 * @returns {Object} - Fact check result
 */
exports.analyzeYouTubeVideo = async (youtubeUrl) => {
	let downloadedFilePath = null;
	const startTime = Date.now();

	try {
		console.log(`\n${"=".repeat(60)}`);
		console.log(`[FactChecker] Starting analysis for: ${youtubeUrl}`);
		console.log(`${"=".repeat(60)}`);

		// Cleanup old temp files
		youtubeService.cleanupOldFiles();

		// Step 1: Validate URL
		const urlValidation = youtubeService.validateYouTubeUrl(youtubeUrl);

		if (!urlValidation.isValid) {
			console.log(`[FactChecker] Invalid URL`);
			return { status: 400, msg: "Invalid YouTube URL format", data: null };
		}

		const videoId = urlValidation.videoId;
		console.log(`[FactChecker] Video ID: ${videoId}`);

		// Step 2: Try to get transcript first (FAST method - ~3-5 seconds)
		console.log(`\n[FactChecker] STEP 1: Attempting transcript fetch (fast method)...`);
		const transcriptResult = await youtubeService.getTranscript(videoId);

		if (transcriptResult.status === 200 && transcriptResult.data?.transcript) {
			console.log(`[FactChecker] ✓ Transcript available! Using fast analysis.`);
			
			// Analyze transcript with Gemini
			console.log(`\n[FactChecker] STEP 2: Sending to Gemini for analysis...`);
			const analysisResult = await geminiService.analyzeTranscript(transcriptResult.data.transcript);

			if (analysisResult.status === 200) {
				const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
				console.log(`\n[FactChecker] ✓ Analysis complete in ${elapsed}s (transcript method)`);
				console.log(`${"=".repeat(60)}\n`);

				return {
					status: 200,
					msg: "Video fact-checked successfully",
					data: formatResponse(analysisResult.data, videoId, youtubeUrl, {
						durationSeconds: transcriptResult.data.durationSeconds,
						method: "transcript",
						processingTime: `${elapsed}s`
					})
				};
			}

			// If Gemini fails, return the error
			console.log(`[FactChecker] ✗ Gemini analysis failed: ${analysisResult.msg}`);
			return analysisResult;
		}

		// Step 3: Fallback to video download + upload (SLOW method - ~1-3 minutes)
		console.log(`[FactChecker] ✗ No transcript available. Falling back to video analysis (slow method)...`);
		console.log(`[FactChecker] ⚠ This may take 1-3 minutes depending on video length.\n`);

		console.log(`[FactChecker] STEP 2: Downloading video...`);
		const downloadResult = await youtubeService.downloadVideo(youtubeUrl);

		if (downloadResult.status !== 200) {
			console.log(`[FactChecker] ✗ Download failed: ${downloadResult.msg}`);
			return downloadResult;
		}

		downloadedFilePath = downloadResult.data.filePath;
		console.log(`[FactChecker] ✓ Video downloaded successfully`);

		// Analyze video/audio with Gemini
		console.log(`\n[FactChecker] STEP 3: Uploading and analyzing with Gemini...`);
		const analysisResult = await geminiService.analyzeVideo(
			downloadResult.data.filePath,
			downloadResult.data.fileName,
			downloadResult.data.mimeType
		);

		// Cleanup local file
		youtubeService.deleteVideoFile(downloadedFilePath);
		downloadedFilePath = null;

		if (analysisResult.status !== 200) {
			console.log(`[FactChecker] ✗ Analysis failed: ${analysisResult.msg}`);
			return analysisResult;
		}

		const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
		console.log(`\n[FactChecker] ✓ Analysis complete in ${elapsed}s (video method)`);
		console.log(`${"=".repeat(60)}\n`);

		return {
			status: 200,
			msg: "Video fact-checked successfully",
			data: formatResponse(analysisResult.data, videoId, youtubeUrl, {
				videoTitle: downloadResult.data.videoTitle,
				durationSeconds: downloadResult.data.durationSeconds,
				method: "video",
				processingTime: `${elapsed}s`
			})
		};

	} catch (error) {
		console.error(`[FactChecker] ✗ Error:`, error.message);

		// Cleanup on error
		if (downloadedFilePath) {
			youtubeService.deleteVideoFile(downloadedFilePath);
		}

		return {
			status: 500,
			msg: "Internal server error during analysis",
			data: error.message
		};
	}
};
