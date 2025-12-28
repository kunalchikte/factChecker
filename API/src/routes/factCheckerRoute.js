const factCheckerController = require("../app/controllers/factCheckerController");
const factCheckerValidation = require("../app/middleware/validation/factCheckerValidate");

module.exports = function (router, auth) { // eslint-disable-line
	/**
	 * POST /fact-check/analyze
	 * Analyzes a YouTube video for fact checking
	 * Public endpoint - no authentication required
	 */
	router.post(
		"/fact-check/analyze",
		factCheckerValidation.valAnalyzeVideo,
		factCheckerController.analyzeVideo
	);
	
	/**
	 * POST /fact-check/analyze/auth
	 * Analyzes a YouTube video for fact checking (authenticated)
	 * Protected endpoint - requires authentication
	 */
	router.post(
		"/fact-check/analyze/auth",
		auth.verifyToken,
		factCheckerValidation.valAnalyzeVideo,
		factCheckerController.analyzeVideo
	);

	/**
	 * GET /fact-check/history/:videoId
	 * Retrieves fact check history for a specific video
	 * Public endpoint - no authentication required
	 */
	router.get(
		"/fact-check/history/:videoId",
		factCheckerValidation.valGetHistory,
		factCheckerController.getHistory
	);
};
