const cors = require("cors");

module.exports = function (app) {
	const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
	
	// Get allowed origins from environment variable
	// In production, specify exact origins; in development, allow all
	let allowedOrigins = process.env.CORS_ORIGINS 
		? process.env.CORS_ORIGINS.split(",").map(origin => origin.trim())
		: [];

	// Default development origins
	if (!isProduction && allowedOrigins.length === 0) {
		allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5173", // Vite default
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173"
		];
	}

	const corsOptions = {
		origin: function (origin, callback) {
			// Allow requests with no origin (mobile apps, curl, Postman)
			if (!origin) {
				return callback(null, true);
			}

			// In development with no specific origins, allow all
			if (!isProduction && allowedOrigins.length === 0) {
				return callback(null, true);
			}

			// Check if origin is allowed
			if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
				return callback(null, true);
			}

			// Block the request
			callback(new Error("Not allowed by CORS"));
		},
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
			"Origin"
		],
		exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
		credentials: true,
		maxAge: 86400, // 24 hours preflight cache
		optionsSuccessStatus: 200
	};

	app.use(cors(corsOptions));

	// Log CORS configuration
	if (!isProduction) {
		console.log(`CORS enabled for origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "all (development mode)"}`);
	}
};
