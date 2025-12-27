const model = require("../models/userModel");
const passwordHelper = require("../helper/passwordOp");
const dbService = require("./dbService");
const title = "User";

const MongoObjectID = require("mongoose").Types.ObjectId;

/**
* Function that Get Users.
* @return This model function that get Users list with the Count ID.
*/

exports.getUserByCondition = async (cond,proj={}) => {
	const params = {model,oneResult:true,cond,proj};
	return await dbService.getModel(params);
};

/**
* Function that Get Users.
* @return This model function that get Users with the condition count.
*/

exports.getUserCountByCondition = async (cond) => {
	return await dbService.getCountModel({model,cond});
};

/**
* Function that update Users.
* @return This model function that update Users by condition.
*/

exports.updateUserByCondition = async (cond,data) => {
	return await dbService.updateModel({model,title,cond,data});
};

exports.addUser = async (data,autoGenPas=false) => {
	try{
		let plainPassword = data?.password || "";
		if(autoGenPas)
			plainPassword = await passwordHelper.generatePassword();

		let resHashPassword = await passwordHelper.hashPassword(plainPassword);
		data.password = resHashPassword.hashPassword;

		data.plainPassword = plainPassword;

		const result =  await dbService.addModel({model,title,data});
		return result;
	}
	catch (err) {
		return {status:400,msg:"Error",data:err.toString()};
	}
};

/**
* Function that Get Users.
* @return This model function that get Users list with the Count ID.
*/

exports.getUser = async (cond,proj={},skip=0,limit=10) => {
	try {
		// Handle the type condition
		if(Object.prototype.hasOwnProperty.call(cond,"type")){
			cond = {...cond};
		} else {
			cond = {...cond,"type": { "$ne": "admin" }};
		}

		// Convert the condition to work with aggregation
		const matchStage = { $match: cond };
		
		// Create the aggregation pipeline
		const pipeline = [
			matchStage,
			{
				$lookup: {
					from: "wallet",
					localField: "_id",
					foreignField: "userId",
					as: "wallet"
				}
			},
			{ $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true } },
			{ $sort: { _id: -1 } },
			{ $skip: skip },
			{ $limit: limit },
			{
				$project: {
					...proj,
					_id: 0,
					id: "$_id",
					balances: { $ifNull: ["$wallet.balances", {}] }
				}
			}
		];

		// Execute the aggregation
		const data = await model.aggregate(pipeline);
		
		// Get the total count for pagination
		const total = await model.countDocuments(cond);
		
		return { status: 200, msg: "Success", data, total };
	} catch (err) {
		return { status: 400, msg: "Error", data: err.toString() };
	}
};

/**
* Function that update User.
* @return This model function that update User by ID.
*/

exports.updateUser = async (data) => {
	return await dbService.updateModel({model,title,data});
};

exports.delUser = async (srcId,userId) => {
	return await dbService.delModel({model,title,srcId,userId});
};

exports.updateManyUser = async (userIds,set) => {
	try{
		userIds.map(id => new MongoObjectID(id));
		const result = await model.updateMany(
			{ _id: { $in: userIds } }, // Match users by ID
			{ $set: set }  // Update type field
		);
		return {status:200,msg:title+" Updated Successfully",data:null};
	}
	catch (err) {
		return {status:400,msg:"Error",data:err.toString()};
	}
};