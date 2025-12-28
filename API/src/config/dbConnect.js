const mongoose = require("mongoose");

// Skip DB connection if SKIP_DB is set
if (process.env.SKIP_DB === "true") {
	console.log("Skipping MongoDB connection (SKIP_DB=true)");
} else {
	// Support both full connection string or building from parts
	let connectionString = process.env.MONGODB_URI || process.env.DB_CONNECTION_STRING;
	
	if (!connectionString) {
		// Build connection string from parts
		const dbUrl = process.env.DB_URL;
		const dbName = process.env.DB_NAME;
		const dbUsername = process.env.DB_USERNAME;
		const dbPassword = process.env.DB_PASSWORD;
		const dbAuthSource = process.env.DB_AUTH_SOURCE;

		if (!dbUrl) {
			console.log("Skipping MongoDB connection (DB_URL not set)");
		} else {
			try {
				const url = new URL(dbUrl);
				
				if (dbUsername) {
					url.username = dbUsername;
				}
				
				if (dbPassword) {
					url.password = encodeURIComponent(dbPassword);
				}
				
				url.pathname = "/" + dbName;
				
				// Add auth source if username is provided
				if (dbUsername && dbAuthSource) {
					url.searchParams.set("authSource", dbAuthSource);
				}
				
				connectionString = url.toString();
			} catch (err) {
				console.log("MongoDB configuration error:", err.message);
			}
		}
	}

	if (connectionString) {
		mongoose.connect(connectionString)
			.then(() => {
				console.log("MongoDB connected successfully");
			})
			.catch((err) => {
				console.log("MongoDB connection error (non-fatal):", err.message);
			});
	}
}

// Export mongoose connection for use elsewhere
module.exports = mongoose;
