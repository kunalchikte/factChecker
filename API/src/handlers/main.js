const express = require("express");
const app = express();
const router = express.Router();
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");

// Load environment variables first
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const server = http.createServer(app);

// Compression middleware
app.use(compression({
	filter: (req, res) => {
		if (req.headers["x-no-compression"]) return false;
		return compression.filter(req, res);
	},
	level: 6
}));

// Security: Enhanced Helmet configuration
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			styleSrc: ["'self'", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			mediaSrc: ["'self'"],
			frameSrc: ["'none'"]
		}
	},
	crossOriginEmbedderPolicy: true,
	crossOriginOpenerPolicy: true,
	crossOriginResourcePolicy: { policy: "same-site" },
	dnsPrefetchControl: { allow: false },
	frameguard: { action: "deny" },
	hidePoweredBy: true,
	hsts: {
		maxAge: 31536000, // 1 year
		includeSubDomains: true,
		preload: true
	},
	ieNoOpen: true,
	noSniff: true,
	originAgentCluster: true,
	permittedCrossDomainPolicies: { permittedPolicies: "none" },
	referrerPolicy: { policy: "strict-origin-when-cross-origin" },
	xssFilter: true
}));

// Security: Disable X-Powered-By header (redundant with helmet but explicit)
app.disable("x-powered-by");

// Security: Trust proxy if behind reverse proxy (for rate limiting)
if (process.env.TRUST_PROXY === "true") {
	app.set("trust proxy", 1);
}

// Rate Limiting - must be before routes
require("../config/rateLimit")(app);

// Parse JSON with size limit
app.use(express.json({ 
	limit: "1mb", // Reduced from 10mb - we only need small JSON payloads
	strict: true
}));
app.use(express.urlencoded({ 
	extended: true, 
	limit: "1mb",
	parameterLimit: 50 // Limit number of parameters
}));

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
	if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
		return res.status(400).json({
			status: 400,
			msg: "Invalid JSON payload",
			data: null
		});
	}
	next(err);
});

// CORS configuration
require("../config/cors")(app);

// Health check endpoint (before auth)
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database connection (optional)
require("../config/dbConnect");

// Routes
require("../routes")(app, router);

// Global error handler - must be last
app.use((err, req, res, next) => { // eslint-disable-line
	const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod";
	
	// Log error in development
	if (!isProduction) {
		console.error("Error:", err.message);
	}

	// Don't leak error details in production
	res.status(err.status || 500).json({
		status: err.status || 500,
		msg: isProduction ? "Internal Server Error" : err.message,
		data: null
	});
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, (err) => {
	if (process.env.NODE_ENV !== "prod" && process.env.NODE_ENV !== "production") {
		if (!err) {
			console.log(`Server running on port ${PORT}`);
			console.log(`Environment: ${process.env.NODE_ENV}`);
		} else {
			console.error("Error starting server:", err);
		}
	}
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("SIGTERM received. Shutting down gracefully...");
	server.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});

process.on("SIGINT", () => {
	console.log("SIGINT received. Shutting down gracefully...");
	server.close(() => {
		console.log("Server closed");
		process.exit(0);
	});
});
