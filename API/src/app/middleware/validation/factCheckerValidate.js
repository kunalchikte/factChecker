const val = require("./validator");

/**
 * YouTube URL validation pattern
 * Strict pattern to prevent malicious URLs
 */
const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(\?[a-zA-Z0-9_=&-]*)?$/;

/**
 * YouTube video ID pattern (exactly 11 characters)
 */
const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Sanitizes YouTube URL by extracting and rebuilding from video ID
 * Prevents URL-based attacks
 */
const sanitizeYouTubeUrl = (url) => {
	if (!url || typeof url !== "string") return null;
	
	// Extract video ID
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
			// Validate video ID characters
			const videoId = match[1];
			if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
				return `https://www.youtube.com/watch?v=${videoId}`;
			}
		}
	}
	return null;
};

/**
 * Validation conditions for fact checker
 */
const conditions = {
	youtubeUrl: {
		...val.groupExistTrimNotEmpty("YouTube URL"),
		isLength: {
			options: { min: 10, max: 200 },
			errorMessage: "YouTube URL must be between 10 and 200 characters"
		},
		matches: {
			options: youtubeUrlPattern,
			errorMessage: "Please provide a valid YouTube URL (https://youtube.com/watch?v=... or https://youtu.be/...)"
		},
		custom: {
			options: (value, { req }) => {
				// Additional security checks
				
				// Check for null bytes
				if (value.includes("\0")) {
					throw new Error("Invalid characters in URL");
				}
				
				// Check for common injection patterns
				const dangerousPatterns = [
					/[;&|`$(){}[\]<>]/,  // Shell metacharacters
					/\.\./,              // Path traversal
					/%00/,               // Null byte encoding
					/%0[aAdD]/,          // Newline encoding
				];
				
				for (const pattern of dangerousPatterns) {
					if (pattern.test(value)) {
						throw new Error("Invalid characters in URL");
					}
				}
				
				// Sanitize and validate
				const sanitizedUrl = sanitizeYouTubeUrl(value);
				if (!sanitizedUrl) {
					throw new Error("Could not parse YouTube URL");
				}
				
				// Store sanitized URL for use in controller
				req.sanitizedYouTubeUrl = sanitizedUrl;
				
				return true;
			}
		}
	},
	videoId: {
		in: ["params"],
		trim: true,
		notEmpty: {
			errorMessage: "Video ID is required"
		},
		isLength: {
			options: { min: 11, max: 11 },
			errorMessage: "Video ID must be exactly 11 characters"
		},
		matches: {
			options: videoIdPattern,
			errorMessage: "Invalid video ID format. Must be 11 alphanumeric characters (including - and _)"
		},
		custom: {
			options: (value) => {
				// Additional security check for null bytes and injection
				if (value.includes("\0") || /[;&|`$(){}[\]<>]/.test(value)) {
					throw new Error("Invalid characters in video ID");
				}
				return true;
			}
		}
	}
};

/**
 * Validates the analyze video request
 */
exports.valAnalyzeVideo = (req, res, next) => {
	const schema = {
		youtubeUrl: conditions.youtubeUrl
	};
	val.validateSchema(req, res, next, schema);
};

/**
 * Validates the get history request (path parameter)
 */
exports.valGetHistory = (req, res, next) => {
	const schema = {
		videoId: conditions.videoId
	};
	val.validateSchema(req, res, next, schema);
};
