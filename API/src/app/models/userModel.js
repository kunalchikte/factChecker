const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const objectId = Schema.Types.ObjectId;

const authSchema = new Schema({
	token 		: {type:String},
	deviceId	: {type:String,default: ""},
	updatedAt	: {type:Number, default: Date.now}
},{_id:false, timestamps:true});

const UserSchema = new Schema({
	fName			: {type:String,default: ""},
	lName			: {type:String,default: ""},
	email			: {type:String,default: ""},//unique: true
	phone			: {type:String,default: ""},//unique: true
	password 		: {type:String,default: ""},
	plainPassword 	: {type:String,default: ""},
	type 			: {type:String,default: "user"},//admin,user.
	profileImg  	: {type:String,default: ""},
	authToken 		: [authSchema],
	passOtp       	: {type:String,default: ""},
	emailOtp     	: {type:String,default: ""},
	phoneOtp     	: {type:String,default: ""},
	emailVerify 	: {type:Boolean,default: false},
	phoneVerify 	: {type:Boolean,default: false},
	userReferalCode : {type:String,default: ""},
	referby   		: {
		userId 		: {type:objectId,default: null,ref: "User", index: true},
		referalCode : {type:String,default: "", index: true}
	},
	currency   		: {type:String,default: ""},
	walletAddress 	: {type:String,default: ""},
	walletUserId 	: {type:String,default: ""},
	status 			: {type: String, enum: ["active","inactive"],default: "active"},
	statusMFA		: {type:Boolean,default: false},
	secreteMFA 		: {type:String,default: null},
	verifiedMFA		: {type:Boolean,default: false},
	createdBy 		: {type:objectId,default: null,ref: "User"},
	updatedBy 		: {type:objectId,default: null,ref: "User"},
	deleted			: {
		status		: {type:Boolean,default: false},	
		at 			: {type: Number, default: Date.now},	
		by 			: {type:objectId,default: null,ref: "User"}
	}
},{id:false, timestamps:true, versionKey:false, strictQuery:false, collection:"users"});

UserSchema.virtual("id").get(function() {
	return this._id.toHexString();
});

UserSchema.set("toJSON", {
	virtuals: true,
	transform: function (doc, ret) {delete ret._id;}
});

module.exports =  mongoose.models.User || mongoose.model("User", UserSchema);