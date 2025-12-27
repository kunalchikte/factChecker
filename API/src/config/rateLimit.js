const rateLimit = require("express-rate-limit");

module.exports = function (app) {
	// Always enable rate limiting for security
	const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
	
	// Stricter limits for production
	const windowMs = (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000;
	const maxRequests = parseInt(process.env.RATE_LIMIT_MAX) || (isProduction ? 50 : 100);

	// General API rate limiter
	const generalLimiter = rateLimit({
		windowMs: windowMs,
		max: maxRequests,
		message: {
			status: 429,
			msg: "Too many requests. Please try again later.",
			data: null
		},
		standardHeaders: true,
		legacyHeaders: false,
		// Skip rate limiting for health checks
		skip: (req) => req.path === "/health",
		handler: (req, res, next, options) => {
			res.status(429).json(options.message);
		}
	});

	// Stricter limiter for fact-check endpoint (expensive operation)
	const factCheckLimiter = rateLimit({
		windowMs: 60 * 1000, // 1 minute window
		max: isProduction ? 5 : 10, // 5 requests per minute in production
		message: {
			status: 429,
			msg: "Too many fact-check requests. Please wait before trying again.",
			data: null
		},
		standardHeaders: true,
		legacyHeaders: false,
		handler: (req, res, next, options) => {
			res.status(429).json(options.message);
		}
	});

	// Apply general limiter to all routes
	app.use(generalLimiter);

	// Apply stricter limiter to fact-check endpoints
	app.use("/fact-check", factCheckLimiter);

	console.log(`Rate limiting enabled: ${maxRequests} requests per ${windowMs / 60000} minutes`);
};
