const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Schema for storing fact check results
 * Uses JSON type for flexible response storage
 */
const FactCheckHistorySchema = new Schema({
	videoId: {
		type: String,
		required: true,
		unique: true,
		index: true,
		trim: true,
		maxlength: 11,
		minlength: 11
	},
	youtubeUrl: {
		type: String,
		required: true,
		trim: true,
		maxlength: 200
	},
	videoTitle: {
		type: String,
		default: "",
		trim: true,
		maxlength: 500
	},
	analysisMethod: {
		type: String,
		enum: ["transcript", "video"],
		default: "transcript"
	},
	// Store the complete Gemini response as JSON
	analysisResult: {
		type: Schema.Types.Mixed,
		required: true
	},
	// Extracted summary fields for quick access without parsing JSON
	summary: {
		type: String,
		default: ""
	},
	videoTopic: {
		type: String,
		default: ""
	},
	trustScore: {
		type: Number,
		default: 0,
		min: 0,
		max: 100
	},
	trustLevel: {
		type: String,
		enum: ["HIGH", "MEDIUM", "LOW"],
		default: "LOW"
	},
	totalClaims: {
		type: Number,
		default: 0
	},
	correctClaimsCount: {
		type: Number,
		default: 0
	},
	incorrectClaimsCount: {
		type: Number,
		default: 0
	},
	speculativeClaimsCount: {
		type: Number,
		default: 0
	},
	// Processing metadata
	processingTime: {
		type: Number,
		default: 0
	},
	requestCount: {
		type: Number,
		default: 1
	},
	lastAnalyzedAt: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true,
	versionKey: false,
	collection: "fact_check_history"
});

// Compound index for faster queries
FactCheckHistorySchema.index({ videoId: 1, lastAnalyzedAt: -1 });

// Index on trustScore for potential filtering
FactCheckHistorySchema.index({ trustScore: 1 });

// Text index for searching by video title or topic
FactCheckHistorySchema.index({ videoTitle: "text", videoTopic: "text" });

// Virtual for id
FactCheckHistorySchema.virtual("id").get(function() {
	return this._id.toHexString();
});

// Transform JSON output
FactCheckHistorySchema.set("toJSON", {
	virtuals: true,
	transform: function (doc, ret) {
		delete ret._id;
		return ret;
	}
});

/**
 * Static method to upsert (insert or update) a fact check result
 * @param {string} videoId - YouTube video ID
 * @param {Object} data - Fact check data to store
 */
FactCheckHistorySchema.statics.upsertByVideoId = async function(videoId, data) {
	const existingRecord = await this.findOne({ videoId });
	
	if (existingRecord) {
		// Update existing record and increment request count
		return await this.findOneAndUpdate(
			{ videoId },
			{
				...data,
				requestCount: existingRecord.requestCount + 1,
				lastAnalyzedAt: new Date()
			},
			{ new: true }
		);
	} else {
		// Create new record
		return await this.create({
			videoId,
			...data,
			lastAnalyzedAt: new Date()
		});
	}
};

/**
 * Static method to find by video ID
 * @param {string} videoId - YouTube video ID
 */
FactCheckHistorySchema.statics.findByVideoId = async function(videoId) {
	return await this.findOne({ videoId }).lean();
};

module.exports = mongoose.models.FactCheckHistory || mongoose.model("FactCheckHistory", FactCheckHistorySchema);

