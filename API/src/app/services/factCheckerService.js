const youtubeService = require("./youtubeService");
const geminiService = require("./geminiService");
const FactCheckHistory = require("../models/factCheckHistoryModel");

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
 * Saves or updates fact check result in database
 * @param {string} videoId - YouTube video ID
 * @param {Object} formattedResponse - Formatted response data
 * @param {Object} rawAnalysis - Raw Gemini analysis result
 * @param {string} method - Analysis method used (transcript/video)
 */
const saveToHistory = async (videoId, formattedResponse, rawAnalysis, method) => {
	try {
		// Check if database is available
		const mongoose = require("mongoose");
		if (mongoose.connection.readyState !== 1) {
			console.log(`[FactChecker] Database not connected, skipping history save`);
			return null;
		}

		const historyData = {
			youtubeUrl: formattedResponse.video.url,
			videoTitle: formattedResponse.video.title,
			analysisMethod: method,
			analysisResult: rawAnalysis, // Store complete JSON response
			summary: formattedResponse.summary,
			videoTopic: formattedResponse.video.topic,
			trustScore: formattedResponse.trust.score,
			trustLevel: formattedResponse.trust.level,
			totalClaims: formattedResponse.factCheck.totalClaims,
			correctClaimsCount: formattedResponse.factCheck.correctClaims.length,
			incorrectClaimsCount: formattedResponse.factCheck.incorrectClaims.length,
			speculativeClaimsCount: formattedResponse.factCheck.speculativeClaims.length,
			processingTime: parseFloat(formattedResponse.processingTime) || 0
		};

		const savedRecord = await FactCheckHistory.upsertByVideoId(videoId, historyData);
		console.log(`[FactChecker] History saved/updated for video: ${videoId}`);
		return savedRecord;

	} catch (error) {
		console.error(`[FactChecker] Failed to save history: ${error.message}`);
		return null;
	}
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

		// Step 2: Check if we already have cached result in database
		const mongoose = require("mongoose");
		if (mongoose.connection.readyState === 1) {
			console.log(`\n[FactChecker] Checking cache for existing analysis...`);
			const cachedResult = await FactCheckHistory.findByVideoId(videoId);
			
			if (cachedResult && cachedResult.analysisResult) {
				console.log(`[FactChecker] ✓ Found cached result! Returning immediately.`);
				console.log(`${"=".repeat(60)}\n`);

				// Increment request count (non-blocking)
				FactCheckHistory.findOneAndUpdate(
					{ videoId },
					{ $inc: { requestCount: 1 }, lastAnalyzedAt: new Date() }
				).catch(() => {}); // Ignore errors

				// Format and return cached response
				const formattedResponse = {
					video: {
						id: cachedResult.videoId,
						url: cachedResult.youtubeUrl,
						title: cachedResult.videoTitle,
						topic: cachedResult.videoTopic,
						durationSeconds: cachedResult.analysisResult?.durationSeconds || 0
					},
					summary: cachedResult.summary,
					factCheck: {
						totalClaims: cachedResult.totalClaims,
						correctClaims: cachedResult.analysisResult?.correctClaims || [],
						incorrectClaims: cachedResult.analysisResult?.incorrectClaims || [],
						speculativeClaims: cachedResult.analysisResult?.speculativeClaims || [],
						correctPercentage: cachedResult.analysisResult?.correctPercentage || 0,
						incorrectPercentage: cachedResult.analysisResult?.incorrectPercentage || 0,
						speculativePercentage: cachedResult.analysisResult?.speculativePercentage || 0
					},
					trust: {
						score: cachedResult.trustScore,
						level: cachedResult.trustLevel
					},
					analysisNote: cachedResult.analysisResult?.analysisNote || "",
					method: cachedResult.analysisMethod,
					processingTime: "0s (cached)",
					cached: true,
					metadata: {
						originalAnalyzedAt: cachedResult.createdAt,
						requestCount: cachedResult.requestCount + 1
					}
				};

				return {
					status: 200,
					msg: "Video fact-check retrieved from cache",
					data: formattedResponse
				};
			}
			console.log(`[FactChecker] No cached result found. Proceeding with analysis...`);
		}

		// Step 3: Try to get transcript first (FAST method - ~3-5 seconds)
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

				const formattedData = formatResponse(analysisResult.data, videoId, youtubeUrl, {
					durationSeconds: transcriptResult.data.durationSeconds,
					method: "transcript",
					processingTime: `${elapsed}s`
				});

				// Save to history (non-blocking)
				saveToHistory(videoId, formattedData, analysisResult.data, "transcript");

				return {
					status: 200,
					msg: "Video fact-checked successfully",
					data: formattedData
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

		const formattedData = formatResponse(analysisResult.data, videoId, youtubeUrl, {
			videoTitle: downloadResult.data.videoTitle,
			durationSeconds: downloadResult.data.durationSeconds,
			method: "video",
			processingTime: `${elapsed}s`
		});

		// Save to history (non-blocking)
		saveToHistory(videoId, formattedData, analysisResult.data, "video");

		return {
			status: 200,
			msg: "Video fact-checked successfully",
			data: formattedData
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
			data: null
		};
	}
};

/**
 * Retrieves fact check history for a video
 * @param {string} videoId - YouTube video ID
 * @returns {Object} - History record or not found
 */
exports.getHistoryByVideoId = async (videoId) => {
	try {
		// Validate video ID format
		if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
			return {
				status: 400,
				msg: "Invalid video ID format",
				data: null
			};
		}

		// Check if database is available
		const mongoose = require("mongoose");
		if (mongoose.connection.readyState !== 1) {
			return {
				status: 503,
				msg: "Database not available",
				data: null
			};
		}

		const historyRecord = await FactCheckHistory.findByVideoId(videoId);

		if (!historyRecord) {
			return {
				status: 404,
				msg: "No history found for this video",
				data: null
			};
		}

		// Format the response to match the analyze API format
		const formattedResponse = {
			video: {
				id: historyRecord.videoId,
				url: historyRecord.youtubeUrl,
				title: historyRecord.videoTitle,
				topic: historyRecord.videoTopic
			},
			summary: historyRecord.summary,
			factCheck: {
				totalClaims: historyRecord.totalClaims,
				correctClaims: historyRecord.analysisResult?.correctClaims || [],
				incorrectClaims: historyRecord.analysisResult?.incorrectClaims || [],
				speculativeClaims: historyRecord.analysisResult?.speculativeClaims || [],
				correctPercentage: historyRecord.analysisResult?.correctPercentage || 0,
				incorrectPercentage: historyRecord.analysisResult?.incorrectPercentage || 0,
				speculativePercentage: historyRecord.analysisResult?.speculativePercentage || 0
			},
			trust: {
				score: historyRecord.trustScore,
				level: historyRecord.trustLevel
			},
			analysisNote: historyRecord.analysisResult?.analysisNote || "",
			method: historyRecord.analysisMethod,
			processingTime: `${historyRecord.processingTime}s`,
			metadata: {
				analyzedAt: historyRecord.lastAnalyzedAt,
				requestCount: historyRecord.requestCount,
				createdAt: historyRecord.createdAt,
				updatedAt: historyRecord.updatedAt
			}
		};

		return {
			status: 200,
			msg: "History retrieved successfully",
			data: formattedResponse
		};

	} catch (error) {
		console.error(`[FactChecker] History fetch error:`, error.message);
		return {
			status: 500,
			msg: "Failed to retrieve history",
			data: null
		};
	}
};
