const fs = require("fs");
const path = require("path");
const directoryPath = path.join(__dirname, "./");
const auth = require("../app/middleware/auth/auth");

module.exports = function (app, router) {
	// Dynamically load all route files
	fs.readdirSync(directoryPath).forEach(file => {
		if (file !== "index.js" && file.endsWith(".js")) {
			require("./" + file)(router, auth);
		}
	});

	// Mount router
	app.use("", router);

	// 404 handler - must be last
	app.use((req, res) => {
		res.status(404).json({ 
			status: 404, 
			msg: "Endpoint not found", 
			data: null 
		});
	});
};
