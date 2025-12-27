const factCheckerController = require("../app/controllers/factCheckerController");
const factCheckerValidation = require("../app/middleware/validation/factCheckerValidate");

module.exports = function (router, auth) { // eslint-disable-line
	// Public endpoint - no authentication required for fact checking
	router.post(
		"/fact-check/analyze",
		factCheckerValidation.valAnalyzeVideo,
		factCheckerController.analyzeVideo
	);
	
	// Protected endpoint - requires authentication
	router.post(
		"/fact-check/analyze/auth",
		auth.verifyToken,
		factCheckerValidation.valAnalyzeVideo,
		factCheckerController.analyzeVideo
	);
};

