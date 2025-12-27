const bcrypt = require("bcryptjs");

exports.hashPassword = async (plainTextPassword) => {
	try{
		let saltRounds = parseInt(process.env.SALTROUNDS);
		let salt = await bcrypt.genSalt(saltRounds);
		let hashPassword = await bcrypt.hash(plainTextPassword, salt);
		return {status:true,msg:"success",hashPassword:hashPassword};
	} catch(err) {
		return {status:false,errMsg:err.toString()};
	}
};

exports.checkPassword = async (plainTextPassword,hashPassword) => {
	try{
		let checkPassword = await bcrypt.compare(plainTextPassword, hashPassword);
		if(checkPassword)
			return {status:true,msg:"password matched"};
		else
			return {status:false,msg:"password not matched"};
	} catch(err) {
		return {status:false,errMsg:err.toString()};
	}
};	

exports.generatePassword = async() => {
	
	var length = 8,
		smallC = "abcdefghijklmnopqrstuvwxyz",
		capC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		numC = "0123456789",
		specialC = "!@#$%&*+-_=";

	let charset= smallC+capC;
	n = charset.length;
	let retVal = (charset).charAt(Math.floor(Math.random() * n));

	charset= smallC;
	n = charset.length;
	retVal += (charset).charAt(Math.floor(Math.random() * n));

	charset= capC;
	n = charset.length;
	retVal += (charset).charAt(Math.floor(Math.random() * n));

	charset= numC;
	n = charset.length;
	retVal += (charset).charAt(Math.floor(Math.random() * n));

	charset= specialC;
	n = charset.length;
	retVal += (charset).charAt(Math.floor(Math.random() * n));

	length = length-5;

	if(length > 0){
		charset = smallC+capC+numC+specialC;
		for (var i = 0, n = charset.length; i < length; ++i) {
			retVal += charset.charAt(Math.floor(Math.random() * n));
		}
	}

	return retVal;
};