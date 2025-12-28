const cors = require("cors");

module.exports = function (app) {
	// Get allowed origins from environment variable
	// Set CORS_ORIGINS=* to allow all, or comma-separated list of origins
	const corsOriginsEnv = process.env.CORS_ORIGINS;
	
	let allowedOrigins = [];
	let allowAll = false;

	if (corsOriginsEnv === "*") {
		allowAll = true;
	} else if (corsOriginsEnv) {
		allowedOrigins = corsOriginsEnv.split(",").map(origin => origin.trim());
	} else {
		// Default origins when CORS_ORIGINS is not set
		allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:5173",
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
			// Add your production origins here or set via CORS_ORIGINS env
			"http://3.110.103.228:3000",
			"http://factchecker.kunalchikte.in",
			"https://factchecker.kunalchikte.in"
		];
	}

	const corsOptions = {
		origin: function (origin, callback) {
			// Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
			if (!origin) {
				return callback(null, true);
			}

			// Allow all origins if configured
			if (allowAll) {
				return callback(null, true);
			}

			// Check if origin is in allowed list
			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}

			// Log blocked origin for debugging
			console.log(`[CORS] Blocked origin: ${origin}`);
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
		maxAge: 86400,
		optionsSuccessStatus: 200
	};

	// Apply CORS to all routes (handles preflight OPTIONS automatically)
	app.use(cors(corsOptions));

	console.log(`CORS enabled: ${allowAll ? "ALL ORIGINS" : allowedOrigins.join(", ")}`);
};
