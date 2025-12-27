const factCheckerService = require("../services/factCheckerService");

/**
 * Controller to analyze YouTube video for fact checking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.analyzeVideo = async (req, res) => {
	try {
		// Use sanitized URL from validation middleware for security
		const youtubeUrl = req.sanitizedYouTubeUrl || req.body.youtubeUrl;
		
		if (!youtubeUrl) {
			return res.status(400).json({
				status: 400,
				msg: "YouTube URL is required",
				data: null
			});
		}
		
		const result = await factCheckerService.analyzeYouTubeVideo(youtubeUrl);
		res.status(result.status).json(result);
	} catch (err) {
		// Don't expose internal errors
		res.status(500).json({
			status: 500,
			msg: "Internal Server Error",
			data: null
		});
	}
};

