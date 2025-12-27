const passwordRegx=[/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*+\-_=])[a-zA-Z0-9!@#$%&*+\-_=]{8,16}$/, "g"];
const val = require("./validator");
const userService = require("../../services/userService");

let conditions = {
	email:{
		...val.groupExistTrimNotEmpty("Email"),
		...val.commonMail(),
		...val.commonUniqueMail()
	},
	emailBeforeLogin:{
		...val.groupExistTrimNotEmpty("Email"),
		...val.commonMail(),
		custom: {
			options: async (value, { req, location, path }) => { // eslint-disable-line
				let cond = {"email":value};
				const result = await userService.getUserCountByCondition(cond);
				if(result.status > 200 || result.data == null)
					throw new Error("Email not registered");
			}
		}
	},
	password:{
		...val.groupExistTrimNotEmpty("Password"),
		matches:{
			options: passwordRegx,
			errorMessage: "Invalid password"
		}
	},
	phone:{
		...val.groupExistTrimNotEmpty("phone"),
		custom: {
			options: async (value, { req, location, path }) => { // eslint-disable-line
				let cond = {"phone":value};
				if(typeof(req.body.userId)!="undefined" && req.body.userId !=""){
					cond._id = {$ne:req.body.userId};
				}
				const result = await userService.getUserCountByCondition(cond);
				if(result.data !== null)
					throw new Error("Phone already register");
			}
		}
	},
	mediaType:(field,enumValues=[]) => {
		return {
			...val.groupExistTrimNotEmpty(field),
			custom: {
				options: (value) => enumValues.includes(value),
				errorMessage: `${field} must be one of the following values: ${enumValues.join(", ")}`
			}
		};
	},
	userId:{
		...val.groupExistTrimNotEmpty("User id"),
		custom: {
			options: async (value, { req, location, path }) => { // eslint-disable-line
				const result = await userService.getUserCountByCondition({_id:value,"deleted.status": { "$ne": true }});
				if(result.status > 200 || result.data == null)
					throw new Error("User does not exists");
			}
		}
	},
	passOTP:{
		...val.groupExistTrimNotEmpty("OTP"),
		custom: {
			options: async (value, { req, location, path }) => { // eslint-disable-line
				const result = await userService.getUserCountByCondition({passOtp:value,"deleted.status": { "$ne": true }});
				if(result.status > 200 || result.data == null)
					throw new Error("Invalid OTP");
			}
		}
	},
	emailOTP:{
		...val.groupExistTrimNotEmpty("OTP"),
		custom: {
			options: async (value, { req, location, path }) => { // eslint-disable-line
				const result = await userService.getUserCountByCondition({emailOtp:value,"deleted.status": { "$ne": true }});
				if(result.status > 200 || result.data == null)
					throw new Error("Invalid OTP");
			}
		}
	},
	status:{
		...val.groupExistTrimNotEmpty("Status"),
		isIn:{
			options: [["active","inactive"]],
			errorMessage: "Status must contain \"active\" Or \"inactive\" value",
		}
	}
};

/**
* This Function that Verify the valid User Signup.
*/
exports.valUserRegister = (req, res, next) => {
	const schema = {
		fName	 : val.groupExistTrimNotEmpty("First name"),
		lName	 : val.groupExistTrimNotEmpty("Last name"),
		email	 : conditions.email,
		// phone	 : conditions.phone,
		password : conditions.password,
		deviceId : val.groupExistTrimNotEmpty("deviceId")
	};

	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid User login.
*/

exports.valUserLogin = (req, res, next) => {
	const schema = {
		username: val.groupExistNotEmpty("Username"),
		password: conditions.password
	};
	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid User social signup.
*/
exports.valUserMediaLogin = (req, res, next) => {
	conditions.email.custom= {
		options: async (value, { req, location, path }) => { // eslint-disable-line
			let cond = {"email":value};
			const result = await userService.getUserCountByCondition(cond);
			if(result.status == 200 && result.data)
				req.body.isExist = true;
			else
				req.body.isExist = false;
		}
	};
	const schema = {
		email		: conditions.email,
		mediaId	: val.groupExistTrimNotEmpty("mediaId"),
		mediaToken	: val.groupExistTrimNotEmpty("mediaToken"),
		mediaType	: conditions.mediaType("mediaType",["Google","Apple"]),
		deviceId	: val.groupExistTrimNotEmpty("deviceId"),
	};

	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid User Data for forgot email.
*/

exports.valUserForgotPassword = (req, res, next) => {
	// conditions.email.custom= {
	// 	options: async (value, { req, location, path }) => { // eslint-disable-line
	// 		let cond = {"email":value};
	// 		const result = await userService.getUserCountByCondition(cond);
	// 		if(result.status > 200 || result.data == null)
	// 			throw new Error("Email not registered");
	// 	}
	// };
	const schema = {
		email:conditions.emailBeforeLogin
	};
	val.validateSchema(req, res, next,schema);
};

exports.valMediaLogin = (req, res, next) => {
	const schema= {
		fname 		: val.groupExistTrimNotEmpty("fname"),
		email 		: conditions.email,
		loginType   : conditions.loginType,
		mediaToken	: val.groupExistTrimNotEmpty("mediaToken"),
	};
	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid User For Update.
*/
exports.valUserAdd = (req, res, next, update=false) => {
	const schema = {
		fName	 	: val.groupExistTrimNotEmpty("First name"),
		lName	 	: val.groupExistTrimNotEmpty("Last name"),
		email	 	: conditions.email,
		// phone	 	: conditions.phone,
		profileImg 	: val.optional()
	};

	if(update){
		schema.userId = conditions.userId;
		delete req.body.password;
		delete req.body.email;
		delete schema.email;
		delete req.body.phone;
		delete schema.phone;
	}
	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid User For Add.
*/
exports.valUserUpdate = (req, res, next) => {
	this.valUserAdd(req, res, next, true);
};

/**
* This Function that Verify the valid User For Add.
*/
exports.valUserUpdateProfile = (req, res, next) => {
	delete req.body.password;
	delete req.body.email;
	delete req.body.phone;

	const schema = {
		fName	 	: val.groupExistTrimNotEmpty("First name"),
		lName	 	: val.groupExistTrimNotEmpty("Last name"),
		profileImg 	: val.optional()
	};
	
	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid Example delete.
*/

exports.valUserDelete = (req, res, next) => {
	const schema = {
		userId:conditions.userId
	};
	val.validateSchema(req, res, next,schema);
};

exports.valUserChangePassword = (req, res, next) => {
	const schema = {
		password: conditions.password
	};
	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid OTP user for forgot password.
*/

exports.valUserVerifyPassOTP = (req, res, next) => {
	const schema = {
		otp  	 : conditions.passOTP,
		email 	 : conditions.emailBeforeLogin,
		password : conditions.password
	};
	val.validateSchema(req, res, next,schema);
};

/**
* This Function that Verify the valid OTP for user email.
*/

exports.valUserVerifyEmailOTP = (req, res, next) => {
	const schema = {
		otp   :conditions.emailOTP,
		email :conditions.emailBeforeLogin
	};
	val.validateSchema(req, res, next,schema);
};

exports.valUserChangeStatus = (req, res, next) => {
	const schema = {
		status   : conditions.status,
		userIds  : val.arrayOfIds("User Ids"),
	};
	val.validateSchema(req, res, next,schema);
};