const userController = require("../app/controllers/userController");
const userValidation = require("../app/middleware/validation/userValidate");

module.exports = function (router,auth) {	
	router.post("/user/register",userValidation.valUserRegister,userController.userRegister);
	router.post("/user/login",userValidation.valUserLogin,userController.userLogin);
	router.get("/user/logout",auth.verifyToken,auth.destroyToken);
	router.post("/user/forgotPassword",userValidation.valUserForgotPassword,userController.userForgotPassword);
	router.post("/user/changeForgotPassword",userValidation.valUserVerifyPassOTP,userController.userChangeForgotPassword);
	router.get("/user/profile",auth.verifyToken,userController.userProfile);
	router.put("/user/profile",auth.verifyToken,userValidation.valUserUpdateProfile,userController.userUpdateProfile);
	router.put("/user/mediaLogin",auth.verifyToken,userValidation.valMediaLogin,userController.mediaLogin);
	router.post("/user/varifyEmail",userValidation.valUserVerifyEmailOTP,userController.userVerifyEmail);

	router.get("/user/list",auth.verifyToken,userController.userList);
	router.post("/user/changeStatus",auth.verifyToken,userValidation.valUserChangeStatus,userController.userChangeStatus);

	router.post("/user/changePassword",auth.verifyToken,userValidation.valUserChangePassword,userController.userChangePassword);

	router.get("/user/enableMFA",auth.verifyToken,userController.enableMFA);
	router.get("/user/activateMFA/:token",auth.verifyToken,userController.activateMFA);

	router.get("/user/disableMFA",auth.verifyToken,userController.disableMFA);
};