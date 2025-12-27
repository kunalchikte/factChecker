const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { YoutubeTranscript } = require("youtube-transcript");

const execPromise = util.promisify(exec);

// Temp directory for storing downloaded videos
const TEMP_DIR = path.join(__dirname, "../../../temp");

// Maximum file size allowed (100 MB) - prevents DoS via large file downloads
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Maximum video duration allowed (60 minutes) - prevents abuse
const MAX_DURATION_SECONDS = 60 * 60;

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
	fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Sanitizes video ID to prevent command injection
 * Only allows alphanumeric, underscore, and hyphen characters
 * @param {string} videoId - The video ID to sanitize
 * @returns {string|null} - Sanitized video ID or null if invalid
 */
const sanitizeVideoId = (videoId) => {
	if (!videoId || typeof videoId !== "string") return null;
	
	// YouTube video IDs are exactly 11 characters: alphanumeric, underscore, hyphen
	const sanitized = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
	
	if (sanitized.length !== 11) return null;
	
	return sanitized;
};

/**
 * Extracts and validates video ID from various YouTube URL formats
 * @param {string} url - The YouTube URL
 * @returns {string|null} - Sanitized video ID or null
 */
const extractVideoId = (url) => {
	if (!url || typeof url !== "string") return null;
	
	// Limit URL length to prevent ReDoS
	if (url.length > 200) return null;
	
	const patterns = [
		/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
		/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
		/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
		/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
		/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return sanitizeVideoId(match[1]);
		}
	}
	return null;
};

/**
 * Builds a safe YouTube URL from validated video ID
 * Prevents command injection by constructing URL from sanitized ID
 * @param {string} videoId - Sanitized video ID
 * @returns {string} - Safe YouTube URL
 */
const buildSafeYouTubeUrl = (videoId) => {
	return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Fetches transcript from YouTube (FAST - preferred method)
 * @param {string} videoId - The YouTube video ID
 * @returns {Object} - Result with transcript data
 */
exports.getTranscript = async (videoId) => {
	try {
		// Sanitize video ID to prevent injection
		const safeVideoId = sanitizeVideoId(videoId);
		if (!safeVideoId) {
			return {
				status: 400,
				msg: "Invalid video ID format",
				data: null
			};
		}
		
		console.log(`Fetching transcript for video: ${safeVideoId}`);
		
		const transcriptItems = await YoutubeTranscript.fetchTranscript(safeVideoId);
		
		if (!transcriptItems || transcriptItems.length === 0) {
			return {
				status: 404,
				msg: "No transcript available",
				data: null
			};
		}

		// Combine all transcript segments into one text
		const fullTranscript = transcriptItems
			.map(item => item.text)
			.join(" ")
			.replace(/\s+/g, " ")
			.trim();

		// Calculate approximate video duration from transcript
		const lastItem = transcriptItems[transcriptItems.length - 1];
		const durationSeconds = lastItem ? Math.ceil((lastItem.offset + lastItem.duration) / 1000) : 0;

		console.log(`Transcript fetched: ${fullTranscript.split(/\s+/).length} words`);

		return {
			status: 200,
			msg: "Transcript fetched successfully",
			data: {
				transcript: fullTranscript,
				wordCount: fullTranscript.split(/\s+/).length,
				durationSeconds,
				segmentCount: transcriptItems.length
			}
		};

	} catch (error) {
		console.log(`Transcript fetch failed: ${error.message}`);
		return {
			status: 404,
			msg: "Transcript not available",
			data: null
		};
	}
};

/**
 * Downloads a YouTube video to temp directory using yt-dlp (SLOW - fallback method)
 * @param {string} youtubeUrl - The YouTube video URL
 * @returns {Object} - Result with file path and metadata
 */
exports.downloadVideo = async (youtubeUrl) => {
	try {
		const videoId = extractVideoId(youtubeUrl);

		if (!videoId) {
			return {
				status: 400,
				msg: "Invalid YouTube URL format",
				data: null
			};
		}

		console.log(`Downloading video: ${videoId} (this may take a while...)`);

		// Build safe URL from validated video ID (prevents command injection)
		const safeUrl = buildSafeYouTubeUrl(videoId);

		// Get video info first using safe URL
		let videoInfo;
		try {
			const { stdout } = await execPromise(
				`yt-dlp --dump-json --no-download -- "${safeUrl}"`,
				{ 
					maxBuffer: 10 * 1024 * 1024,
					timeout: 30000 // 30 second timeout for info fetch
				}
			);
			videoInfo = JSON.parse(stdout);
		} catch (infoError) {
			return {
				status: 400,
				msg: "Could not fetch video information",
				data: null
			};
		}

		const videoTitle = (videoInfo.title || "Unknown Title").substring(0, 200); // Limit title length
		const durationSeconds = videoInfo.duration || 0;

		// Security check: Limit video duration
		if (durationSeconds > MAX_DURATION_SECONDS) {
			return {
				status: 400,
				msg: `Video too long. Maximum duration is ${MAX_DURATION_SECONDS / 60} minutes.`,
				data: null
			};
		}

		// Generate safe filename using only videoId and timestamp
		const timestamp = Date.now();
		const fileName = `${videoId}_${timestamp}.mp4`;
		const filePath = path.join(TEMP_DIR, fileName);

		// Verify filePath is within TEMP_DIR (prevent path traversal)
		const resolvedPath = path.resolve(filePath);
		const resolvedTempDir = path.resolve(TEMP_DIR);
		if (!resolvedPath.startsWith(resolvedTempDir)) {
			return {
				status: 400,
				msg: "Invalid file path",
				data: null
			};
		}

		// Download smallest video quality for faster processing
		console.log(`[YouTube] Starting download (optimized for speed)...`);
		const downloadStart = Date.now();
		
		// Use -- to separate URL from options (prevents URL being interpreted as option)
		const downloadCmd = `yt-dlp -f "worstvideo[ext=mp4]+worstaudio[ext=m4a]/worst[ext=mp4]/worst" --merge-output-format mp4 --no-playlist -o "${filePath}" -- "${safeUrl}"`;

		try {
			await execPromise(downloadCmd, {
				maxBuffer: 50 * 1024 * 1024,
				timeout: 180000 // 3 minutes
			});
		} catch (downloadError) {
			// Fallback: try any format
			console.log(`[YouTube] Primary format failed, trying fallback...`);
			const fallbackCmd = `yt-dlp -f "worst" --no-playlist -o "${filePath}" -- "${safeUrl}"`;
			await execPromise(fallbackCmd, {
				maxBuffer: 50 * 1024 * 1024,
				timeout: 180000
			});
		}
		
		console.log(`[YouTube] Download completed in ${((Date.now() - downloadStart) / 1000).toFixed(1)}s`);

		// Find the downloaded file
		let actualFilePath = filePath;
		
		if (!fs.existsSync(filePath)) {
			const baseFileName = `${videoId}_${timestamp}`;
			const dirFiles = fs.readdirSync(TEMP_DIR);
			const matchingFile = dirFiles.find(f => f.startsWith(baseFileName));
			
			if (matchingFile) {
				actualFilePath = path.join(TEMP_DIR, matchingFile);
				
				// Verify path is still within TEMP_DIR
				const resolvedActual = path.resolve(actualFilePath);
				if (!resolvedActual.startsWith(resolvedTempDir)) {
					return {
						status: 400,
						msg: "Invalid file path",
						data: null
					};
				}
			}
		}

		if (!fs.existsSync(actualFilePath)) {
			return {
				status: 500,
				msg: "Failed to download video",
				data: null
			};
		}

		const fileStats = fs.statSync(actualFilePath);
		
		// Security check: Limit file size
		if (fileStats.size > MAX_FILE_SIZE) {
			// Delete the oversized file
			fs.unlinkSync(actualFilePath);
			return {
				status: 400,
				msg: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
				data: null
			};
		}

		const actualFileName = path.basename(actualFilePath);
		const fileExtension = path.extname(actualFilePath).toLowerCase();
		
		// Determine mime type based on file extension
		const mimeTypeMap = {
			".mp4": "video/mp4",
			".webm": "video/webm",
			".mkv": "video/x-matroska",
			".m4a": "audio/mp4",
			".mp3": "audio/mpeg",
			".aac": "audio/aac",
			".ogg": "audio/ogg",
			".wav": "audio/wav"
		};
		const mimeType = mimeTypeMap[fileExtension] || "video/mp4";
		
		console.log(`[YouTube] File downloaded: ${actualFileName} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB, ${mimeType})`);

		return {
			status: 200,
			msg: "Video downloaded successfully",
			data: {
				videoId,
				videoTitle,
				filePath: actualFilePath,
				fileName: actualFileName,
				fileSize: fileStats.size,
				durationSeconds,
				mimeType
			}
		};

	} catch (error) {
		return {
			status: 500,
			msg: "Failed to download video",
			data: null // Don't expose internal error messages
		};
	}
};

/**
 * Deletes a video file from temp directory
 * @param {string} filePath - Path to the file to delete
 */
exports.deleteVideoFile = (filePath) => {
	try {
		if (!filePath || typeof filePath !== "string") return;
		
		// Verify path is within TEMP_DIR (prevent directory traversal)
		const resolvedPath = path.resolve(filePath);
		const resolvedTempDir = path.resolve(TEMP_DIR);
		
		if (!resolvedPath.startsWith(resolvedTempDir)) {
			console.error(`Security: Attempted to delete file outside temp dir: ${filePath}`);
			return;
		}
		
		if (fs.existsSync(resolvedPath)) {
			fs.unlinkSync(resolvedPath);
			console.log(`Deleted temp file: ${path.basename(resolvedPath)}`);
		}
	} catch (error) {
		console.error(`Failed to delete temp file`);
	}
};

/**
 * Validates if a YouTube URL is valid and returns video ID
 * @param {string} url - The URL to validate
 * @returns {Object} - Validation result
 */
exports.validateYouTubeUrl = (url) => {
	const videoId = extractVideoId(url);
	return {
		isValid: !!videoId,
		videoId
	};
};

/**
 * Cleans up old temp files (older than 1 hour)
 */
exports.cleanupOldFiles = () => {
	try {
		if (!fs.existsSync(TEMP_DIR)) return;
		
		const files = fs.readdirSync(TEMP_DIR);
		const oneHourAgo = Date.now() - (60 * 60 * 1000);

		files.forEach(file => {
			// Only process files that match expected pattern
			if (!/^[a-zA-Z0-9_-]+\.(mp4|m4a|webm|mkv|mp3|aac|ogg|wav)$/.test(file)) {
				return;
			}
			
			const filePath = path.join(TEMP_DIR, file);
			
			// Verify path is within TEMP_DIR
			const resolvedPath = path.resolve(filePath);
			const resolvedTempDir = path.resolve(TEMP_DIR);
			if (!resolvedPath.startsWith(resolvedTempDir)) return;
			
			try {
				const stats = fs.statSync(resolvedPath);
				if (stats.isFile() && stats.mtimeMs < oneHourAgo) {
					fs.unlinkSync(resolvedPath);
					console.log(`Cleaned up old temp file: ${file}`);
				}
			} catch (e) {
				// Silently ignore individual file errors
			}
		});
	} catch (error) {
		// Silently ignore cleanup errors
	}
};
