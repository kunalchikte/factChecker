const mongoose = require("mongoose");
const dbUrl = process.env.DB_URL;
const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
let dbAuthSource = process.env.DB_AUTH_SOURCE || "";

// Skip DB connection if SKIP_DB is set or DB_URL is not defined
if (process.env.SKIP_DB === "true" || !dbUrl) {
	console.log("Skipping MongoDB connection (SKIP_DB=true or DB_URL not set)");
} else {
	try {
		const MONGODB_CONNECTION_STRING = new URL(dbUrl);

		if (dbUsername) {
			MONGODB_CONNECTION_STRING.username = dbUsername;
		}

		if (dbPassword) {
			MONGODB_CONNECTION_STRING.password = encodeURIComponent(dbPassword);
		}

		if (dbAuthSource) {
			MONGODB_CONNECTION_STRING.search = "authSource=" + dbAuthSource;
		}

		MONGODB_CONNECTION_STRING.pathname = dbName;

		if (mongoose.connection.readyState === 0) {
			mongoose.connect(MONGODB_CONNECTION_STRING.toString())
				.then(() => {
					console.log("MongoDB connected");
				})
				.catch((err) => {
					console.log("MongoDB connection error (non-fatal):", err.message);
				});
		}
	} catch (err) {
		console.log("MongoDB configuration error (non-fatal):", err.message);
	}
}
