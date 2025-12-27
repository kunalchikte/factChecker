const jwt = require("jsonwebtoken");
const userSevice = require("../../services/userService");
// const accessPolicy = require("../../../config/accessPolicy.json");


const verifyByToken = async (token) => {
	try{
		const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
		const userId = decodedToken.userId;
		const userType = decodedToken.userType;

		let result = await userSevice.getUserByCondition({"_id":userId,"authToken":{$elemMatch:{"token":token}}});
		if(result.status == 200 && result.data != null){
			if(result.data.status=="active"){
				return {status:true,msg:"success",data:{userId,userType}};
			}else{
				let msg = "Your account has been deactivated. Please contact the administrator for assistance.";
				return {status:false, msg:msg, data:null};
			}
		}
		return {status:false,msg:"Invalid Token!",data:null};
	} catch(err) { // eslint-disable-line
		return {status:false,msg:"Valid token require!",data:null};
	}
};

const verifyTokenFun = async (req) => {
	try{
		const reqContextMethod = req?.requestContext?.http?.method ?? req.method;
		const reqContextPath = req?.requestContext?.http?.path ?? req.originalUrl;
		const routUrl = (((reqContextMethod+reqContextPath).toLowerCase()).split("?"))[0]; // eslint-disable-line
		
		const token = req.query.token || req.headers.authorization.split(" ")[1];
		const result = await verifyByToken(token);
		if(result.status){
			req.userId = result.data.userId;
			req.userType = result.data.userType;
		}
		return result;
	} catch(err) { // eslint-disable-line
		return {status:false,msg:"Valid token require!",data:null};
	}
};

exports.optionalVerifyToken = async (req, res, next) => {	
	await verifyTokenFun(req);
	next();
};

exports.verifyToken = async (req, res, next) => {
	const result = await verifyTokenFun(req);
	if(result.status) {
		next();
	} else {
		return res.status(401).json({ status: 401, msg: result.msg, data: null });
	}
};

// Middleware for WebSocket Authentication
exports.verifySocketToken = async (token, next) => {
   	let result = await verifyByToken(token);
    return next(result);
};

/**
* This Function that update the token and token allows you to verify that the content hasn't been tampered with.
*/

exports.genToken = async (data) => {
	try {
        
		let timestmp = Date.now();
		data.createdAt = timestmp;
		let tokenExpire = "7d";
		let token = jwt.sign(data, process.env.TOKEN_SECRET,{expiresIn:tokenExpire});
		let deviceId = data.deviceId;
        
		let id = data.userId;

		//clear_old_token
		await userSevice.updateUserByCondition({"_id":id},{$pull: {authToken:{token:{$exists: true},deviceId:deviceId,createdAt:{$exists: true}}}});
		let result = await userSevice.updateUserByCondition({"_id":id},{ $push:{"authToken":{"token":token,"deviceId":deviceId,"createdAt":timestmp}}});
		if(result.status == 200)
			return {status:true,msg:"success",token:token};
		else
			throw new Error("Unable to generate token, Please try again!");

	} catch(err) {
		return {status:false,errMsg:err.toString()};
	}
};

/**
* This function which deletes the token from the previously added token in the data.
*/

exports.destroyToken = async (req, res) => { 
	try {
		const token = req.headers.authorization.split(" ")[1];
		let id = req.userId;
		let result = await userSevice.updateUserByCondition({"_id":id},{$pull:{authToken:{token:token}}});
		await userSevice.updateUserByCondition({"_id":id},{fcmToken:""});
		if(result.status == 200)
			result.msg = "Successfully Logout";
		res.status(result.status).json(result);
	} catch(err) { // eslint-disable-line
		res.status(400).json({status:400,msg:"Error",data:null});
	}
};

/**
* This Function use to verify correct App key & App seccrete for API calls
*/
const verifyKeysFun = (req) => {
	try{
		const apiKey = req.headers.api_key;
		const apiSecrete = req.headers.api_secrete;
		if(apiKey==process.env.API_KEY && apiSecrete==process.env.API_SECRETE){
			return {status:200,msg:"sucess",data:null};
		}
		else
			return {status:401,msg:"Please provide valid api key & secrete",data:null};
	
	} catch(err) {
		return {status:401,msg:"Valid api key & secrete require",data:err};
	}
};

exports.verifyKeys = (app) => {
	app.use((req, res, next) => { // check default functions before call to route
		const verifyKeysResult = verifyKeysFun(req);
		if(verifyKeysResult.status!=200){
			res.status(verifyKeysResult.status).json(verifyKeysResult);
		}
		else
			next();
	});
};

