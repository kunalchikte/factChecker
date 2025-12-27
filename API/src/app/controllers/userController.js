const auth = require("../middleware/auth/auth");
const passwordHelper = require("../helper/passwordOp");
const helperCommon = require("../helper/common");
const userService = require("../services/userService");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

/**
* Function that get common login response
* @param common login response. 
* @return
*/

// Enable MFA
exports.enableMFA = async (req,res) => {
    const user = await userService.getUserByCondition({"_id":req.userId},{email:1});
    
    const secret = speakeasy.generateSecret({ name: `1in2:${user.data.email}` });
    let secreteMFA = secret.base32;
    await userService.updateUserByCondition({"_id":req.userId},{secreteMFA});

    try{
    	const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    	res.status(200).json({status:200,msg:"success",data:{ qrCodeUrl, secreteMFA }});
    } catch (err) {
		res.status(400).json({status:400,msg:"QR Code generation failed",data:err.toString()});
	}
    // , (err, qrCodeUrl) => {
    //     if (err){
    //     	return res.status(500).json({status:500,msg:"QR Code generation failed",data:null});
    //     }
    //     res.json({ qrCodeUrl, secret: secret.base32 });
    //     
    // });
};

// Disable MFA
exports.disableMFA = async (req,res) => {
    await userService.updateUserByCondition({"_id":req.userId},{verifiedMFA:false,statusMFA:false});
    res.status(200).json({status:200,msg:"Deactivate Successfully",data:null});
};

// Verify MFA
const verifyMFA = async (token,secreteMFA) => {
	try{
	     const verified =  speakeasy.totp.verify({
	        secret: secreteMFA,
	        encoding: "base32",
	        token,
	        window: 1,
	    });
	    if(verified)
	    	return {status:true,msg:"success",data:verified};
	    else
	    	return {status:false,msg:"invalid TOTP",data:null};
	}
	catch (err) {
		return {status:false,msg:"error",data:err.toString()};
	}
};

exports.activateMFA = async (req,res) => {
    const { token } = req.params;
    const user = await userService.getUserByCondition({"_id":req.userId},{secreteMFA:1});
    const verified = await verifyMFA(token,user.data.secreteMFA);
    if (verified.status) {
        const verifiedMFA = true;
        const statusMFA = true;
        await userService.updateUserByCondition({"_id":req.userId},{verifiedMFA,statusMFA});
        res.status(200).json({status:200,msg:"MFA enabled successfully",data:null});
    } else {
        res.status(400).json({ status:200,msg:"Invalid OTP",data:null });
    }
};

const loginResponse = async(req,res,result,msg) => {
	let id = result.data._id.toString();
	let type = result.data?.type || "user";
	let statusMFA = result.data.statusMFA;
	
	let tokenData = {
		userId 	 : id,
		userType : type,
		deviceId : req.body.deviceId,
		statusMFA : statusMFA
	};
	
	let tokenRes =  await auth.genToken(tokenData);
	if(tokenRes.status)
	{
		result.data = result.data.toJSON();
		delete result.data.password;
		delete result.data.plainPassword;
		delete result.data.passOtp;
		delete result.data.emailOtp;
		delete result.data.phoneOtp;
		delete result.data.secreteMFA;

		result.data.authToken=undefined;
		result.msg = msg;
		result.data.authToken = tokenRes.token;
		
		res.status(result.status).json(result);
	}
	else{
		res.status(500).json({status:500,msg:tokenRes.errMsg,data:null});
	}
};

/**
* Function that Register/signup user
* @param login Register/signup user. 
* @return
*/

exports.userRegister = async (req,res) => {
	req.body.emailOtp 		 = helperCommon.generateRandomNumber(4,false);
	req.body.phoneOtp 		 = helperCommon.generateRandomNumber(4,false);
	req.body.userReferalCode = helperCommon.generateRandomNumber(12,true);
	
	const referalCode = req.body?.referalCode || null;
	if(referalCode){
		const referalUser = await userService.getUserByCondition({"userReferalCode":referalCode},{id:1,fName:1});
		if(referalUser.status==200 && referalUser.data != null){
			req.body.referby = {referalCode:null,userId:null};
			req.body.referby.referalCode = referalCode;
			req.body.referby.userId = referalUser.data.id;
		}
	}
	
	req.body.type = "user";

	const result = await userService.addUser(req.body); // call model to add users details
	loginResponse(req,res,result,"User Register Successfully");
};

/**
* Function that login user
* @param login register user. 
* @return
*/

exports.userLogin = async (req,res) => {

	//below condition check if value in username parameter from request is match with username,phone or email fields
	let $cond = {"$and":[
		{"email":req.body.username},
		{"email": {$nin: ["", null]}}
	]};

	const result = await userService.getUserByCondition($cond,{});

	if(result.status==200 && result.data)
	{
		if(result.data.status=="active"){
			let resCheckPassword = await passwordHelper.checkPassword(req.body.password,result.data.password);
			let $checkPass = resCheckPassword.status;

			if($checkPass && !req.mediaLogin)
			{
				if(result.data.statusMFA){
					const totp = req.body?.totp || null
					if(totp){
						const verified =  await verifyMFA(totp,result.data.secreteMFA);
						if(!verified.status)
							return res.status(202).json({...verified,status:202});
					}
					else
						return res.status(202).json({status:202,msg:"MFA TOTP Require",data:null});
				} 

				loginResponse(req,res,result,"Logged in Successfully");
			}
			else
			{
				res.status(400).json({status:400,msg:"Please enter valid credentials",data:null});
			}
		}
		else
		{
			result.status = 400;
			result.msg = "Your account has been deactivated. Please contact the administrator for assistance.";
			result.data = null;
			delete result.total;
			res.status(result.status).json(result);
		}
	}
	else
	{
		if(req.mediaLogin) await this.userRegister(req,res);
		result.status = 400;
		result.msg = "Please enter valid credentials";
		res.status(result.status).json(result);
	}
};

/**
* Function that user forgot password
* @param update the user forgot password
* @return
*/

exports.userForgotPassword = async (req,res) => {
	try{
		let otp = helperCommon.generateRandomNumber(4,false);
		const updateData = {
			passOtp : otp
		};
		const result = await userService.updateUserByCondition({email:req.body.email},updateData);
		if(result.status==200)
		{
			result.msg = "OTP generated successfully. Please use the OTP to reset your password.";
		}
		// Note: In production, integrate email service to send OTP
		result.OTP = otp;
		res.status(result.status).json(result);
	} catch (err) {
		res.status(400).json({status:400,msg:"Error",data:err.toString()});
	}
};

/**
* Function that update user password.
* @param update User.
* @return
*/
exports.userChangeForgotPassword = async (req, res) => {
	try {
		const hashPassword = await passwordHelper.hashPassword(req.body.password);
		const updateData = { password: hashPassword.hashPassword, passOtp:""};
		const result = await userService.updateUserByCondition({ email:req.body.email, passOtp: req.body.otp }, updateData);
		result.msg = "Password updated successfully";
		res.status(result.status).json(result);
	} catch (err) {
		res.status(500).json({ status: 500, msg: "Internal Server Error", data: err.toString() });
	}
};

/**
* Function that get Users detail.
* @param Get the User detail.
* @return
*/

exports.userProfile = async (req,res) =>{
	const projects = {authToken:0,password:0,plainPassword:0,passOtp:0,emailOtp:0,phoneOtp:0};
	const result = await userService.getUserByCondition({_id:req.userId,"deleted.status": { "$ne": true }},projects);
	res.status(result.status).json(result);
};

/**
* Function that update User.
* @param update User.
* @return
*/

exports.userUpdateProfile = async (req,res) =>{
	try {

		let updateData = {
			"fName": req.body.fName,
			"lName": req.body.lName,
			"statusMFA": req.body.statusMFA,
			"currency": req.body.currency,
			"updatedBy" : req.userId
		};

		if(req.body.profileImg){
			updateData.profileImg = req.body.profileImg;
		}
		
		updateData = helperCommon.filterData(updateData);

		const result = await userService.updateUserByCondition({_id:req.userId},updateData);
		if(result.status==200)
			result.msg = "Profile Updated Successfully";
		res.status(result.status).json(result);
		
	} catch (err) {
		res.status(400).json({status:400,msg:"Error",data:err.toString()});
	}
};

exports.mediaLogin = async(req, res) => {
	try{
		const  loginType = req.body.signupType; 
		const token = req.body.token;
		if ( loginType == "Google") {
			let config = {
				method: "get",
				maxBodyLength: Infinity,
				url: "https://oauth2.googleapis.com/tokeninfo",
				headers: {
					"Authorization": `Bearer ${token}`
				}
			};
			const response = await axios.request(config);
			if (response.data.aud !== process.env.GOOGLE_CLIENT_ID) {
				return { status: false, msg: "Invalid token" };
			}
		} else if ( loginType == "Apple") {
			const response = jwt.decode(token, { complete: true }).payload;
			if (response.aud !== process.env.APPLE_CLIENT_ID) {
				return { status: false, msg: "Invalid token" };
			}
		}
		req.mediaLogin = true;
		await this.userLogin(req,res);
		// return { status: true, msg: "success" };
	}catch(exception){
		res.status(500).json({status:500,msg:"Error",data:exception.message});
	}
};

/**
* Function that list of User.
* @param Get the list of User.
* @return
*/

exports.userList = async (req,res) => {
	const skip = helperCommon.getPagignationSkip(req.query);
	const limit = helperCommon.getPagignationLimit(req.query);
	let cond = {};
	if(req.query.userId){
		cond._id= req.query.userId;
	}
	if(req.query.status){
		cond.status= req.query.status;
	}
	const proj = {fName:1,lName:1,email:1,phone:1,profileImg:1,status:1,type:1};
	cond = await helperCommon.getSearchCond(cond,req.query,["fName","lName","email","phone"]);
	const result = await userService.getUser(cond,proj,skip,limit);
	res.status(result.status).json(result);
};

/**
* Function that list of User.
* @param Get the list of User.
* @return
*/

exports.userDetail = async (req,res) => {
	let cond = {"userId":req.userId};
	const result = await userService.getUser(cond);
	res.status(result.status).json(result);
};

/**
* Function that update User.
* @param update User.
* @return
*/

exports.userUpdate = async (req,res) =>{
	try {
		let updateData = helperCommon.filterData(req.body);
		updateData.id = req.body.userId;
		updateData.updatedBy = req.userId;
		const result = await userService.updateUser(updateData);
		res.status(result.status).json(result);
	} catch (err) {
		res.status(400).json({status:400,msg:"Error",data:err.toString()});
	}
};

/**
* Function that delete of User.
* @param delete of User.
* @return
*/

exports.userDelete = async (req,res) =>{
	const result = await userService.delUser(req.params.userId,req.userId);	
	res.status(result.status).json(result);
};

/**
* Function that update user password.
* @param update User.
* @return
*/
exports.userChangePassword = async (req, res) => {
	try {
		const hashPassword = await passwordHelper.hashPassword(req.body.password);
		const updateData = { password: hashPassword.hashPassword || hashPassword };
		const result = await userService.updateUserByCondition({ _id: req.userId }, updateData);
		res.status(result.status).json(result);
	} catch (err) {
		res.status(500).json({ status: 500, msg: "Internal Server Error", data: err.toString() });
	}
};

/**
 * Verifies the user's email.
 * @param {Object} req - The request object containing the user's email and OTP.
 * @param {Object} res - The response object.
 * @returns {void}
 */

exports.userVerifyEmail = async (req, res) => {
	try {
		const updateData = {emailVerify: true, emailOtp:""};
		const result = await userService.updateUserByCondition({ email:req.body.email, emailOtp: req.body.otp }, updateData);
		result.msg = "Email verified successfully";
		res.status(result.status).json(result);
	} catch (err) {
		res.status(500).json({ status: 500, msg: "Internal Server Error", data: err.toString() });
	}
};

exports.userChangeStatus = async (req,res) =>{
	try {
		const result = await userService.updateManyUser(req.body.userIds,{status:req.body.status});
		res.status(result.status).json(result);
	} catch (err) {
		res.status(400).json({status:400,msg:"Error",data:err.toString()});
	}
};

/**
* Function that update user password.
* @param update User.
* @return
*/
exports.userChangePassword = async (req, res) => {
	try {
		const hashPassword = await passwordHelper.hashPassword(req.body.password);
		const updateData = {plainPassword:req.body.password, password: hashPassword.hashPassword};
		const result = await userService.updateUserByCondition({_id:req.userId}, updateData);
		result.msg = "Password updated successfully";
		res.status(result.status).json(result);
	} catch (err) {
		res.status(500).json({ status: 500, msg: "Internal Server Error", data: err.toString() });
	}
};