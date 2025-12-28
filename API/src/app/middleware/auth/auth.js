const jwt = require("jsonwebtoken");

/**
 * Simplified auth middleware for fact-checker API
 * User management has been removed - this provides basic JWT verification
 */

/**
 * Verifies JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Verification result
 */
const verifyByToken = async (token) => {
	try {
		if (!token) {
			return { status: false, msg: "Token required", data: null };
		}

		const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
		
		if (!decodedToken) {
			return { status: false, msg: "Invalid Token!", data: null };
		}

		return {
			status: true,
			msg: "success",
			data: {
				userId: decodedToken.userId,
				userType: decodedToken.userType || "user"
			}
		};
	} catch (err) {
		if (err.name === "TokenExpiredError") {
			return { status: false, msg: "Token expired", data: null };
		}
		if (err.name === "JsonWebTokenError") {
			return { status: false, msg: "Invalid token", data: null };
		}
		return { status: false, msg: "Token verification failed", data: null };
	}
};

/**
 * Extracts and verifies token from request
 * @param {Object} req - Express request object
 * @returns {Object} - Verification result
 */
const verifyTokenFun = async (req) => {
	try {
		let token = null;

		// Try to get token from query params first
		if (req.query.token) {
			token = req.query.token;
		}
		// Then try Authorization header
		else if (req.headers.authorization) {
			const authHeader = req.headers.authorization;
			if (authHeader.startsWith("Bearer ")) {
				token = authHeader.substring(7);
			} else {
				token = authHeader.split(" ")[1];
			}
		}

		if (!token) {
			return { status: false, msg: "Authorization token required", data: null };
		}

		const result = await verifyByToken(token);
		
		if (result.status) {
			req.userId = result.data.userId;
			req.userType = result.data.userType;
		}
		
		return result;
	} catch (err) {
		return { status: false, msg: "Token verification failed", data: null };
	}
};

/**
 * Optional token verification - continues even if token is invalid
 */
exports.optionalVerifyToken = async (req, res, next) => {
	await verifyTokenFun(req);
	next();
};

/**
 * Required token verification - blocks request if token is invalid
 */
exports.verifyToken = async (req, res, next) => {
	const result = await verifyTokenFun(req);
	if (result.status) {
		next();
	} else {
		return res.status(401).json({ status: 401, msg: result.msg, data: null });
	}
};

/**
 * WebSocket token verification
 */
exports.verifySocketToken = async (token, next) => {
	const result = await verifyByToken(token);
	return next(result);
};

/**
 * Generate JWT token
 * @param {Object} data - Data to encode in token
 * @returns {Object} - Token generation result
 */
exports.genToken = async (data) => {
	try {
		const tokenExpire = process.env.TOKEN_EXPIRE || "7d";
		const token = jwt.sign(
			{
				userId: data.userId,
				userType: data.userType || "user",
				createdAt: Date.now()
			},
			process.env.TOKEN_SECRET,
			{ expiresIn: tokenExpire }
		);

		return { status: true, msg: "success", token: token };
	} catch (err) {
		return { status: false, msg: "Failed to generate token", data: null };
	}
};

/**
 * Destroy token (logout) - simplified version
 */
exports.destroyToken = async (req, res) => {
	// In a stateless JWT setup, we just return success
	// Client should remove the token from their storage
	res.status(200).json({
		status: 200,
		msg: "Successfully logged out",
		data: null
	});
};

/**
 * API key verification middleware
 */
const verifyKeysFun = (req) => {
	try {
		const apiKey = req.headers.api_key;
		const apiSecret = req.headers.api_secret || req.headers.api_secrete;

		if (!process.env.API_KEY || !process.env.API_SECRET) {
			// If API keys are not configured, skip verification
			return { status: 200, msg: "success", data: null };
		}

		if (apiKey === process.env.API_KEY && apiSecret === process.env.API_SECRET) {
			return { status: 200, msg: "success", data: null };
		}

		return { status: 401, msg: "Invalid API key or secret", data: null };
	} catch (err) {
		return { status: 401, msg: "API key verification failed", data: null };
	}
};

/**
 * Middleware to verify API keys on all routes
 */
exports.verifyKeys = (app) => {
	app.use((req, res, next) => {
		// Skip verification for health check
		if (req.path === "/health") {
			return next();
		}

		const verifyKeysResult = verifyKeysFun(req);
		if (verifyKeysResult.status !== 200) {
			return res.status(verifyKeysResult.status).json(verifyKeysResult);
		}
		next();
	});
};
