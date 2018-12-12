/**
 * Created by ling xue on 2016/3/2.
 */

var commonUtil = require('mp-common-util');
var sysMsg = commonUtil.systemMsg;
var sysError = commonUtil.systemError;
var resUtil = commonUtil.responseUtil;
var encrypt = commonUtil.encrypt;
var ReturnType = commonUtil.ReturnType;
var listOfValue = require('../util/ListOfValue.js');
var userInfoDAO = require('../dao/UserInfoDAO.js');
var roleDAO = require('../dao/RoleDAO.js');
var redisDAO = require('../dao/RedisDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var sysConfig = require('../config/SystemConfig.js');
var logger = serverLogger.createLogger('UserInfo.js');
var tokenUtil = require('../util/Token.js');
var Seq = require('seq');
var sms = require('../util/SmsUtil.js').sms;
var userMsg = require('./UserMsg.js');
var validateUtil = commonUtil.validateUtil;


function inviteUser(req, res, next) {
    var params = req.params;
    var tenant = params.tenant, phone=params.phone, authUserId=params.authUser.userId;
    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (phone == null) {
        return next(sysError.MissingParameterError("phone is missing", "phone is missing"));
    }

    var user = {
        tenant: tenant,
        email: params.email,
        phone: params.phone,
        name: params.name,
        gender: params.gender,
        address: params.address,
        state: params.state,
        city: params.city,
        zipcode: params.zipcode,
        status: 0,
        type: listOfValue.USER_TYPE_USER,
        att1String: params.att1String,
        att2String: params.att2String,
        att3String: params.att3String,
        createdBy:authUserId,
        updatedBy:authUserId
    };
    Seq().seq(function () {
        var that = this;
        userInfoDAO.createUser(user, function (error, result) {
            if (error) {
                logger.error(' inviteUser ' + error.message);
                if (error.message != null && error.message.indexOf("ER_DUP_ENTRY") > -1) {
                    resUtil.resetFailedRes(res, "User exists already.");
                    return next();
                }
                return resUtil.resInternalError(error, res, next);
            } else {
                if (result && result.insertId) {
                    user.userId = result.insertId;
                    that();
                } else {
                    //logger.error(' addUser ' + error.message);
                    return resUtil.resInternalError(error, res, next);
                }
            }
        });
    }).seq(function(){
        if (sysConfig.smsOptions.enabled) {
            try {
                //is it a async call?
                sms.send(params.phone, {"templateId": sysConfig.smsOptions.inviteUserRegisterTemplateId,
                    "datas": [sysConfig.smsOptions.inviteUserRegisterLink]});
            } catch (err) {
                logger.error(err);
            }
        }
        return resUtil.resetCreateRes(res,{insertId:user.userId},null);
    });
}

function getInvitedUserByPhone(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var phone = params.phone;
    if (tenant == null) {
        return resUtil.resetFailedRes(res, sysMsg.TENANT_NOT_EXIST);
    }
    if (phone == null) {
        return next(sysError.MissingParameterError("phone is missing", "phone is missing"));
    }
    _getInvitedUser(tenant,phone,function(error, result){
        if (error){
            return resUtil.resInternalError(error, res, next);
        }else{
            return resUtil.resetQueryRes(res, result,null,next);
        }
    })

}

function _getInvitedUser(tenant,filter,callback){
    filter.tenant=tenant;
    filter.status=0;
    filter.type=listOfValue.USER_TYPE_USER;
    userInfoDAO.getUser(filter, function (error, rows) {
        if (error) {
            logger.error(' getInvitedUserByPhone ' + error.message);
            callback(error);
        } else {
            if (rows && rows.length > 0) {
                result = rows[0];
                //remove password
                delete result.password;
                delete result.wechatId;
            } else {
                result = null;
            }
            callback(null,result);
        }
    });
}

function _mergeInvitedUserInfo(user,invitedUser){
    user.userId=invitedUser.userId;
    if (user.att1String==null){
        user.att1String=invitedUser.att1String;
    }
    if (user.att2String==null){
        user.att2String=invitedUser.att2String;
    }
    if (user.att3String==null){
        user.att3String=invitedUser.att3String;
    }
    if (user.address==null){
        user.address=invitedUser.address;
    }
    if (user.city==null){
        user.city=invitedUser.city;
    }
    if (user.state==null){
        user.state=invitedUser.state;
    }
    if (user.zipcode==null){
        user.zipcode=invitedUser.zipcode;
    }
    if (user.name==null){
        user.name=invitedUser.name;
    }
    if (user.gender==null){
        user.gender=invitedUser.gender;
    }
    return user;
}

function registerUser(req, res, next) {
    var params = req.params;
    var tenant = params.tenant, method = params.method;
    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (method == listOfValue.USER_AUTH_PHONEPASSWORD) {
        return _registerUserByPhone(tenant, req, res, next);
    }
    else if (method == listOfValue.USER_AUTH_WECHAT) {
        return _registerWechatUser(tenant, req, res, next);
    }
    if (method == listOfValue.USER_AUTH_EMAILPASSWORD) {
        return _registerUserByEmail(tenant, req, res, next);
    }
    else {
        return next(sysError.InvalidArgumentError("wrong registration method", "wrong registration method"));
    }
}
function _registerUser(tenant, user, callback) {
    userInfoDAO.upsertUser(user, function (error, result) {
        if (error) {
            logger.error(' registerUser ' + error.message);
            if (error.message != null && error.message.indexOf("ER_DUP_ENTRY") > -1) {
                return callback(new Error("User exists already."));
            } else {
                return callback(error);
            }
        } else {
            if (result && result.insertId) {
                return callback(null, result.insertId);
            } else {
                //logger.error(' addUser ' + error.message);
                return callback(new Error("No user is registered."));
            }
        }
    });
}


function _getRegUserFromRequest(tenant, req) {
    var params = req.params;
    var userType = listOfValue.USER_TYPE_USER; //default type
    var status=listOfValue.USER_STATUS_ACTIVE; //default status
    var password = params.password;
    var encryptedPwd = null;
    var phone = params.phone;
    var wechatStatus = listOfValue.USER_WECHAT_STATUS_NOT_ACTIVE;//default wechat status
    var gender = 1;
    if (password != null) {
        encryptedPwd = encrypt.encryptByMd5(password);
    }
    if (params.gender != null) {
        gender = params.gender
    }

    var user = {
        tenant: tenant,
        username: params.userName,
        email: params.email,
        phone: params.phone,
        password: encryptedPwd,
        name: params.name,
        gender: gender,
        avatar: params.avatar,
        address: params.address,
        state: params.state,
        city: params.city,
        zipcode: params.zipcode,
        wechatId: params.wechatId,
        wechatStatus: wechatStatus,
        status: status,
        type: userType,
        bizId: params.bizId,
        bizName: params.bizName,
        att1String: params.att1String,
        att2String: params.att2String,
        att3String: params.att3String,
        ssn: params.ssn
    };
    return user;
}

function _registerUserByPhone(tenant, req, res, next) {
    var params = req.params;
    var code = params.code;
    var password = params.password;
    var phone = params.phone;
    var user=null;

    if (phone == null) {
        return next(sysError.MissingParameterError("phone is missing", "phone is missing"));
    }
    if (password == null) {
        return next(sysError.MissingParameterError("password is missing", "password is missing"));
    }
    if (code == null) {
        return next(sysError.MissingParameterError("verification code is missing", "verification code is missing"));
    }

    Seq().seq(function() {
        var that = this;
        var key = listOfValue.CACHE_APPEND_REG + tenant + phone;
        redisDAO.getStringVal({key: key}, function (error, result) {
            if (error) {
                logger.error('getRegCaptcha ' + error.message);
                return resUtil.resInternalError(error, res, next);
            } else {
                if (result == null || result != code) {
                    logger.warn(' regUser ' + phone + " tenant " + tenant + " " + sysMsg.CUST_SMS_CAPTCHA_ERROR);
                    return resUtil.resetFailedRes(res, sysMsg.CUST_SMS_CAPTCHA_ERROR,next);
                }
            }
            that();
        });
    }).seq(function(){
        var that = this;
        user=_getRegUserFromRequest(tenant,req);
        //check user already has a record and is inactive
        _getInvitedUser(tenant,{phone:phone},function(error,result){
            if (error){
                return resUtil.resInternalError(error, res, next);
            }
            if (result !=null){
                user=_mergeInvitedUserInfo(user,result);
            }
            that();
        })
    }).seq(function(){
        _registerUser(tenant,user,function(error,result){
            if(error){
                return resUtil.resetFailedRes(res, error!=null?error.message:"",next);
            }
            //return login token
            var subParams = {
                tenant: tenant,
                userId: result
            };
            return _userLogin(subParams, req, res, next);
        })
    });
}

function _registerWechatUser(tenant, req, res, next) {
    var params = req.params;
    var wechatId = params.wechatId;
    var name = params.name;
    //validation
    if (wechatId == null) {
        return next(sysError.MissingParameterError("wechatId is missing", "wechatId is missing"));
    }
    if (name == null) {
        return next(sysError.MissingParameterError("name is missing", "name is missing"));
    }
    Seq().seq(function(){
        var that = this;
        user=_getRegUserFromRequest(tenant,req);
        user.wechatStatus = listOfValue.USER_WECHAT_STATUS_ACTIVE;
        //check user already has a record and is inactive
        _getInvitedUser(tenant,{wechatId:wechatId},function(error,result){
            if (error){
                return resUtil.resInternalError(error, res, next);
            }
            if (result !=null){
                user=_mergeInvitedUserInfo(user,result);
            }
            that();
        })
    }).seq(function(){
        _registerUser(tenant,user,function(error,result){
            if(error){
                return resUtil.resetFailedRes(res, error!=null?error.message:"",next);
            }
            //return login token
            var subParams = {
                tenant: tenant,
                userId: result
            };
            return _userLogin(subParams, req, res, next);
        })
    });
}

function _registerUserByEmail(tenant, req, res, next) {
    var params = req.params;
    var email = params.email;
    var password = params.password;
    //validation
    if (email == null) {
        return next(sysError.MissingParameterError("email is missing", "email is missing"));
    }

    if (! validateUtil.isEmail(email)){
        return next(sysError.InvalidArgumentError("wrong email format", "wrong email format"));
    }
    if (password == null) {
        return next(sysError.MissingParameterError("password is missing", "password is missing"));
    }
    Seq().seq(function(){
        var that = this;
        user=_getRegUserFromRequest(tenant,req);
        //by default it is inactive
        user.status=listOfValue.USER_STATUS_NOT_ACTIVE; //default status for email registration
        //check user already has a record and is inactive
        _getInvitedUser(tenant,{email:email},function(error,result){
            if (error){
                return resUtil.resInternalError(error, res, next);
            }
            if (result !=null){
                user=_mergeInvitedUserInfo(user,result);
            }
            that();
        })
    }).seq(function() {
        var that = this;
        _registerUser(tenant,user,function(error,result){
            if(error){
                return resUtil.resetFailedRes(res, error!=null?error.message:"",next);
            }else{
                that();
            }
        })
    }).seq(function(){
        //send user activation email
        userMsg.sendActivateUserEmail({tenant: tenant, email: user.email}, function (err) {
            if (err) {
                return resUtil.resetFailedRes(res, err.message, next);
            } else {
                return resUtil.resetSuccessRes(res, next);
            }
        });
    })
}

function userLogin(req, res, next) {
    var params = req.params;
    var tenant = params.tenant, method = params.method;
    //params validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (method == null) {
        return next(sysError.MissingParameterError("auth method is missing", "auth method is missing"));
    }
    if (method == listOfValue.USER_AUTH_PHONEPASSWORD) {
        return _userLoginByPhonePassword(tenant, req, res, next);
    }
    else if (method == listOfValue.USER_AUTH_EMAILPASSWORD) {
        return _userLoginByEmailPassword(tenant, req, res, next);
    }
    else if (method == listOfValue.USER_AUTH_WECHAT) {
        return _userLoginByWechat(tenant, req, res, next);
    }
    else if (method == listOfValue.USER_AUTH_USERNAMEPASSWORD) {
        return _userLoginByUserNamePassword(tenant, req, res, next);
    }
    else if (method == listOfValue.USER_AUTH_TOKEN) {
        return _userLoginByToken(tenant, req, res, next);
    }
    else {
        return next(sysError.InvalidArgumentError("wrong auth method", "wrong auth method"));
    }
}

function refreshToken(req, res, next) {
    var params = req.params;
    var tenant = params.tenant, token = params.token;
    //params validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (token == null) {
        return next(sysError.MissingParameterError("auth token is missing", "auth token is missing"));
    }
    tokenUtil.getAccessToken(tenant, token, function (tokenInfo) {
        logger.debug(tokenInfo);
        if (tokenInfo != null) {
            var subParams = {
                tenant: tenant,
                userId: tokenInfo.user.userId,
                tokenExpireInSeconds: sysConfig.tokenOptions.refreshedTokenExpireInSeconds
            };
            return _userLogin(subParams, req, res, next);
        } else {
            return next(sysError.NotAuthorizedError("user is not authorized", "user is not authorized"));
        }
    });
}

function _userLoginByPhonePassword(tenant, req, res, next) {
    var params = req.params;
    var phone = params.phone;
    var password = params.password;
    //params validation
    if (phone == null) {
        return next(sysError.MissingParameterError("user phone is missing", "user phone is missing"));
    }
    if (password == null) {
        return next(sysError.MissingParameterError("password is missing", "password is missing"));
    }
    var subParams = {
        tenant: tenant,
        phone: phone,
        password: encrypt.encryptByMd5(password),
        tokenExpireInSeconds: sysConfig.tokenOptions.normalTokenExpireInSeconds
    };
    return _userLogin(subParams, req, res, next);
}

function _userLoginByEmailPassword(tenant, req, res, next) {
    var params = req.params;
    var email = params.email;
    var password = params.password;
    //params validation
    if (email == null) {
        return next(sysError.MissingParameterError("email is missing", "email is missing"));
    }
    if (! validateUtil.isEmail(email)){
        return next(sysError.InvalidArgumentError("wrong email format", "wrong email format"));
    }
    if (password == null) {
        return next(sysError.MissingParameterError("password is missing", "password is missing"));
    }
    var subParams = {
        tenant: tenant,
        email: email,
        password: encrypt.encryptByMd5(password),
        tokenExpireInSeconds: sysConfig.tokenOptions.normalTokenExpireInSeconds
    };
    return _userLogin(subParams, req, res, next);
}

function _userLoginByUserNamePassword(tenant, req, res, next) {
    var params = req.params;
    var userName = params.userName;
    var password = params.password;
    //params validation
    if (userName == null) {
        return next(sysError.MissingParameterError("userName is missing", "userName is missing"));
    }
    if (password == null) {
        return next(sysError.MissingParameterError("password is missing", "password is missing"));
    }
    var subParams = {
        tenant: tenant,
        userName: userName,
        password: encrypt.encryptByMd5(password),
        tokenExpireInSeconds: sysConfig.tokenOptions.normalTokenExpireInSeconds
    };
    return _userLogin(subParams, req, res, next);
}

function _userLoginByWechat(tenant, req, res, next) {
    var params = req.params;
    var wechatId = params.wechatId;
    if (wechatId == null) {
        return next(sysError.MissingParameterError("wechatId is missing", "wechatId is missing"));
    }
    var subParams = {
        tenant: tenant,
        wechatId: wechatId,
        tokenExpireInSeconds: sysConfig.tokenOptions.normalTokenExpireInSeconds
    };
    return _userLogin(subParams, req, res, next);
}

function _userLoginByToken(tenant, req, res, next) {
    var params = req.params;
    var token = params.token;
    if (token == null) {
        return next(sysError.MissingParameterError("token is missing", "token is missing"));
    }
    var tokenInfo = null;
    tokenUtil.getAccessToken(tenant, token, function (tokenInfo) {
        logger.debug(tokenInfo);
        if (tokenInfo != null) {
            resUtil.resetQueryRes(res, tokenInfo);
            next();
        } else {
            return next(sysError.NotAuthorizedError("user is not authorized.", "user is not authorized."));
        }
    });
}


function _userLogin(subParams, req, res, next) {
    var i, user;
    var deviceType = req.params.deviceType;
    var tenant = subParams.tenant;

    //default token expiretime
    if (subParams.tokenExpireInSeconds == null) {
        subParams.tokenExpireInSeconds = sysConfig.tokenOptions.normalTokenExpireInSeconds
    }
    var expiredInSeconds = null;
    //only get active user
    subParams.status = 1;
    Seq().seq(function () {
        var that = this;
        userInfoDAO.getUser(subParams, function (error, rows) {
            if (error) {
                logger.error(' userLogin ' + error.message);
                resUtil.resInternalError(error, res, next);
            } else {
                if (rows && rows.length > 0) {
                    user = rows[0];
                    _scrubUserForTokenInfo(user);
                    that();
                } else {
                    logger.error(' userLogin ' + "login failed");
                    return next(sysError.NotAuthorizedError("user is not authorized.", "user is not authorized."));
                }
            }
        });
    }).seq(function () {
        var that = this;
        _getUserPermissionNames({tenant: tenant, userId: user.userId}, function (err, permissions) {
            if (err) {
                return resUtil.resInternalError(err, res, next);
            }
            else if (permissions && permissions.length > 0) {
                user.permissions = [];
                for (i = 0; i < permissions.length; i++) {
                    user.permissions[i] = permissions[i].name;
                }
            }
            that();

        });
    }).seq(function () {
        tokenUtil.createAccessToken(tenant, user, deviceType, subParams.tokenExpireInSeconds, function (err, tokenInfo) {
            if (err) {
                return resUtil.resInternalError(err, res, next);
            }
            else if (tokenInfo) {
                resUtil.resetQueryRes(res, tokenInfo);
                return next();
            } else {
                return resUtil.resInternalError(null, res, next);
            }
        });

    })
}

function _getUserPermissionNames(params, callback) {
    var i, isAdmin = false;
    roleDAO.getUserRoles(params, function (error, rows) {
        if (error) {
            callback(error, null);
        } else {
            if (rows && rows.length > 0) {
                for (i = 0; i < rows.length; i++) {
                    if (listOfValue.ROLE_AMDIN == rows[i].name) {
                        isAdmin = true;
                        break;
                    }
                }
            }
        }
        if (isAdmin) {
            //get all permissions
            roleDAO.getTenantPermissions(params, function (error, rows) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, rows);
                }
            })
        } else {
            roleDAO.getUserPermissions(params, function (error, rows) {
                if (error) {
                    callback(error, null);
                } else {
                    callback(null, rows);
                }
            })
        }
    })

}

function userLogOut(req, res, next) {
    var params = req.params;
    var tenant = params.tenant, token = params.token;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (token == null) {
        return next(sysError.MissingParameterError("token is missing", "token is missing"));
    }
    tokenUtil.removeAccessToken(tenant, token, function (success) {
        if (success) {
            resUtil.resetSuccessRes(res);
        } else {
            resUtil.resetFailedRes(res);
        }
    })
    return next();
}

function _addAUser(tenant, params, callback) {
    var password = params.password;
    var userName = params.userName;
    var userType = params.userType;


    if (userName == null) {
        return callback(new ReturnType(false, "userName is missing"));
    }
    if (password == null) {
        return callback(new ReturnType(false, "password is missing"));
    }
    if (userType == null) {
        return callback(new ReturnType(false, "user type is missing"));
    }

    var status = listOfValue.USER_STATUS_ACTIVE; //default status

    var encryptedPwd = null;

    var gender = 1;
    if (password != null) {
        encryptedPwd = encrypt.encryptByMd5(password);
    }
    if (params.gender != null) {
        gender = params.gender
    }
    var user = {
        tenant: tenant,
        username: userName,
        email: params.email,
        phone: params.phone,
        password: encryptedPwd,
        name: params.name,
        gender: gender,
        avatar: params.avatar,
        address: params.address,
        state: params.state,
        city: params.city,
        zipcode: params.zipcode,
        wechatId: params.wechatId,
        wechatStatus: listOfValue.USER_WECHAT_STATUS_NOT_ACTIVE,
        status: status,
        type: userType,
        bizId: params.bizId,
        bizName: params.bizName,
        att1String: params.att1String,
        att2String: params.att2String,
        att3String: params.att3String,
        ssn: params.ssn
    };
    userInfoDAO.createUser(user, function (error, result) {
        if (error) {
            logger.error(' registerUser ' + error.message);
            if (error.message != null && error.message.indexOf("ER_DUP_ENTRY") > -1) {
                return callback(new ReturnType(false, "User exists already"));
            } else {
                return callback(new ReturnType(false, error.message));
            }
        } else {
            if (result && result.insertId) {
                userId = result.insertId;
                return callback(new ReturnType(true, null, userId));
            } else {
                //logger.error(' addUser ' + error.message);
                return callback(new ReturnType(false, "user not created"));
            }
        }
    });
}

function _deleteAUser(user, callback) {
    var userId=user.userId;
    if (userId == null) {
        return callback(new ReturnType(false, "userId is missing"));
    }
    userInfoDAO.deleteUser(user, function (error, result) {
        if (error) {
            logger.error(' deleteUser ' + error.message);
            return callback(new ReturnType(false, error.message));
        } else {
            if (result && result.affectedRows>0) {
                return callback(new ReturnType(true, null, userId));
            } else {
                //logger.error(' addUser ' + error.message);
                return callback(new ReturnType(false, "user is not found"));
            }
        }
    });
}

function _updateAUser(user, callback) {
    var userId=user.userId;
    if (userId == null) {
        return callback(new ReturnType(false, "userId is missing"));
    }
    userInfoDAO.updateUserInfo(user, function(error, result) {
        if (error) {
            logger.error(' updateUser ' + error.message);
            return callback(new ReturnType(false, error.message));
        } else {
            if (result && result.affectedRows>0) {
                return callback(new ReturnType(true, null, userId));
            } else {
                //logger.error(' addUser ' + error.message);
                return callback(new ReturnType(false, "user is not found"));
            }
        }
    });
}

function _updateAUserWechatStatus(tenant, user, callback) {
    var userId=user.userId, wechatStatus=user.wechatStatus, wechatId=user.wechatId;
    if (userId == null && wechatId==null) {
        return callback(new ReturnType(false, "userId or wechatId is missing"));
    }
    if (wechatStatus == null) {
        return callback(new ReturnType(false, "wechatStatus is missing"));
    }
    //should use extend here
    user.tenant=tenant;
    userInfoDAO.updateUserWechatStatus({tenant:tenant, userId: userId, wechatStatus:wechatStatus,wechatId:wechatId}, function(error, result) {
        if (error) {
            logger.error(' updateUserWechatStatus ' + error.message);
            return callback(new ReturnType(false, error.message));
        } else {
            if (result && result.affectedRows>0) {
                return callback(new ReturnType(true, null, userId));
            } else {
                //logger.error(' addUser ' + error.message);
                return callback(new ReturnType(false, "user is not found"));
            }
        }
    });
}

function _updateAUserStatus(user, callback) {
    var userId=user.userId,status=user.status;
    if (userId == null) {
        return callback(new ReturnType(false, "userId is missing"));
    }
    if (status == null) {
        return callback(new ReturnType(false, "status is missing"));
    }
    Seq().seq(function(){
        var that=this;
        userInfoDAO.updateUserStatus(user, function(error, result) {
            if (error) {
                logger.error(' updateUserStatus ' + error.message);
                that(error);
            } else {
                if (result && result.affectedRows>0) {
                    that();
                } else {
                    //logger.error(' addUser ' + error.message);
                    that(new Error("user is not found"));
                }
            }
        })
    }).seq(function(){
        var that=this;
        if (status==listOfValue.USER_STATUS_NOT_ACTIVE){
            tokenUtil.removeUserTokens({tenant:user.tenant, userId:userId}, function (error) {
                if (error==null) {
                    logger.info("Successfully removed user's active tokens");
                    that();
                } else {
                    logger.error("Failed to remove user's active tokens");
                    that(error);
                }
            })
        }else{
            that();
        }
    }).seq(function (){
        return callback(new ReturnType(true,null,userId));
    }).catch(function (err) {
        return callback(new ReturnType(false,err.message,userId));
    });

}

function _updateAUserType(tenant, user, callback) {
    var userId=user.userId,type=user.type;
    if (userId == null) {
        return callback(new ReturnType(false, "userId is missing"));
    }
    if (type == null) {
        return callback(new ReturnType(false, "type is missing"));
    }
    Seq().par(function(){
        var that = this;
        tokenUtil.removeUserTokens({tenant:tenant, userId:userId}, function (error) {
            if (error==null) {
                logger.info("Successfully removed user's active tokens");
                that();
            } else {
                logger.error("Failed to remove user's active tokens");
                that(error);
            }
        })
    }).par(function(){
        var that=this;
        userInfoDAO.updateUserType({tenant:tenant,userId:userId,type:type}, function(error, result) {
            if (error) {
                logger.error(' updateUserType ' + error.message);
                that(error);
            } else {
                if (result && result.affectedRows>0) {
                    that();
                } else {
                    //logger.error(' addUser ' + error.message);
                    that(new Error("user is not found"));
                }
            }
        })
    }).catch(function (err) {
        return callback(new ReturnType(false,err.message,userId));
    }).seq(function(){
        return callback(new ReturnType(true,null,userId));
    });
}

function addUsers(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        _addAUser(tenant, user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function addBizUsers(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var authUser=params.authUser;
    var result = [];
    var users = params.users;
    var bizId=params.bizId;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.bizId ==null || authUser.bizId !=bizId){
        return next(sysError.NotAuthorizedError("user is not authorized", "user is not authorized"));
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        //make sure the user type is the same ???
        user.userType=authUser.type;
        user.bizId=authUser.bizId;
        _addAUser(tenant, user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function deleteBizUsers(req, res, next) {
    var params = req.params;
    var authUser=params.authUser;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    var bizId = params.bizId;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.bizId ==null || authUser.bizId !=bizId){
        return next(sysError.NotAuthorizedError("user is not authorized", "user is not authorized"));
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        _deleteAUser({tenant:tenant,userId:user.userId,bizId:bizId},function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function deleteUsers(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        _deleteAUser({tenant:tenant,userId:user.userId}, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function updateUsers(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        user.tenant=tenant;
        _updateAUser(user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function updateBizUsers(req, res, next) {
    var params = req.params;
    var authUser=params.authUser;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    var bizId = params.bizId;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.bizId ==null || authUser.bizId !=bizId){
        return next(sysError.NotAuthorizedError("user is not authorized", "user is not authorized"));
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        user.tenant=tenant;
        //same biz
        user.bizId=bizId;
        _updateAUser(user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function updateUsersStatus(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        user.tenant=tenant;
        _updateAUserStatus(user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function updateBizUsersStatus(req, res, next) {
    var params = req.params;
    var authUser=params.authUser;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    var bizId = params.bizId;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.bizId ==null || authUser.bizId !=bizId){
        return next(sysError.NotAuthorizedError("user is not authorized", "user is not authorized"));
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        user.tenant=tenant;
        user.bizId=bizId;
        _updateAUserStatus(user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function updateUsersWechatStatus(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        _updateAUserWechatStatus(tenant, user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function updateUsersType(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var result = [];
    var users = params.users;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (users == null) {
        return next(sysError.MissingParameterError("users is missing", "users is missing"));
    }
    Seq(users).seqEach(function (user, i) {
        var that = this;
        _updateAUserType(tenant, user, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function modifyUserPswd(req, res, next) {
    var params = req.params;
    var userId = params.userId, authUser = params.authUser, authUserId = authUser.userId, tenant = params.tenant,
        oldPassword = params.oldPassword, newPassword = params.newPassword;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUserId != userId) {
        resUtil.resNoAuthorizedError(null, res, next);
    }
    if (newPassword == null) {
        return next(sysError.MissingParameterError("new password is missing", "new password is missing"));
    }
    if (oldPassword == null) {
        return next(sysError.MissingParameterError("old password is missing", "old password is missing"));
    }
    Seq().seq(function () {
        var that = this;
        userInfoDAO.getUser({tenant: tenant, userId: userId, password: encrypt.encryptByMd5(oldPassword)}, function (error, rows) {
            if (error) {
                logger.error('modifyUserPswd' + error.message);
                resUtil.resInternalError(error, res, next);
            } else {
                if (rows && rows.length > 0) {
                    that();
                } else {
                    logger.error(' modifyUserPswd ' + sysMsg.CUST_ORIGIN_PSWD_ERROR);
                    resUtil.resetFailedRes(res, sysMsg.CUST_ORIGIN_PSWD_ERROR);
                    return next();
                }
            }
        });
    }).seq(function () {
        userInfoDAO.updateUserPassword({tenant: tenant, userId: userId, password: encrypt.encryptByMd5(newPassword)}, function (error, result) {
            if (error) {
                logger.error(' modifyUserPswd ' + error.message);
                resUtil.resInternalError(error, res, next);
            } else {
                if (result && result.affectedRows > 0) {
                    res.send(200, {success: true});
                } else {
                    logger.error(' modifyUserPswd: no password modified');
                    resUtil.resetFailedRes(res, "no password modified");
                }
                return next();
            }
        });
    });
}

function resetUserPswd(req, res, next) {
    var params = req.params;
    var tenant = params.tenant, method = params.method;
    if (tenant == null) {
        //to do add new error type
        return resUtil.resetFailedRes(res, sysMsg.TENANT_NOT_EXIST);
    }
    if (method == null) {
        return resUtil.resetFailedRes(res, '密码修改方式未明确');
    }
    //validation
    if (method.replace(' ', '') == listOfValue.RESETPWD_PHONE) {
        return _resetPwdByPhone(tenant, params, res, next);
    } else {
        return next(sysError.InvalidArgumentError("wrong reset password method", "wrong reset password method"));
    }
}

function _resetPwdByPhone(tenant, params, res, next) {
    var phone = params.phone, code = params.code, pwd = params.password;
    if (phone == null) {
        return next(sysError.MissingParameterError("phone is missing", "phone is missing"));
    }
    if (code == null) {
        return next(sysError.MissingParameterError("code is missing", "code is missing"));
    }
    if (pwd == null) {
        return next(sysError.MissingParameterError("password is missing", "password is missing"));
    }

    Seq().seq(function () {
        var that = this;
        var key = listOfValue.CACHE_APPEND_RESETPWD + tenant + phone;
        redisDAO.getStringVal({key: key}, function (error, result) {
            if (error) {
                logger.error('getPasswordCaptcha ' + error.message);
                resUtil.resInternalError(error, res, next);
            } else {
                if (result == null || result != params.code) {
                    logger.warn(' resetUserPswd ' + "tenant: " + tenant + "phone: " + params.phone + sysMsg.CUST_SMS_CAPTCHA_ERROR);
                    resUtil.resetFailedRes(res, sysMsg.CUST_SMS_CAPTCHA_ERROR);
                    return next();
                } else {
                    that();
                }
            }
        });
    }).seq(function () {
        userInfoDAO.updateUserPassword({tenant: tenant, phone: phone, password: encrypt.encryptByMd5(pwd)}, function (error, result) {
            if (error) {
                logger.error(' resetUserPswd ' + error.message);
                resUtil.resInternalError(error, res, next);
            } else {
                if (result && result.affectedRows > 0) {
                    res.send(200, {success: true});
                } else {
                    logger.error(' resetUserPswd ' + "phone is not found");
                    resUtil.resetFailedRes(res, "phone is not found");
                }
                return next();
            }
        });
    });
}

function modifyUserPhone(req, res, next) {
    var params = req.params;
    var userId = params.userId, authUser = params.authUser, authUserId = authUser.userId, tenant = params.tenant,
        phone = params.phone, code = params.code;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUserId != userId) {
        resUtil.resNoAuthorizedError(null, res, next);
    }
    if (phone == null) {
        return next(sysError.MissingParameterError("phone is missing", "phone is missing"));
    }
    if (code == null) {
        return next(sysError.MissingParameterError("code is missing", "colde is missing"));
    }

    Seq().seq(function () {
        var that = this;
        var key = listOfValue.CACHE_APPEND_CHANGPHONE + tenant + phone;
        redisDAO.getStringVal({key: key}, function (error, result) {
            if (error) {
                logger.error('modifyUserPhone: ' + error.message);
                resUtil.resInternalError(error, res, next);
            } else {
                if (result == null || result != code) {
                    logger.warn(' modifyUserPhone ' + "tenant: " + tenant + " phone: " + phone + sysMsg.CUST_SMS_CAPTCHA_ERROR);
                    resUtil.resetFailedRes(res, sysMsg.CUST_SMS_CAPTCHA_ERROR);
                } else {
                    that();
                }
            }
        });
    }).seq(function () {
        var that = this;
        userInfoDAO.updateUserPhone({
                tenant: tenant,
                phone: phone,
                userId: userId
            }, function (error, result) {
                if (error) {
                    logger.error(' modifyUserPhone ' + error.message);
                    if (error.message != null && error.message.indexOf("ER_DUP_ENTRY") > -1) {
                        return resUtil.resetFailedRes(res, "Phone exists already.", next);
                    }else {
                        resUtil.resInternalError(error, res, next);
                    }
                } else {
                    if (result && result.affectedRows > 0) {
                        resUtil.resetSuccessRes(res);
                        return next();
                    } else {
                        logger.error(' modifyUserPhone ' + "phone is not updated");
                        resUtil.resetFailedRes(res, "phone is not updated");
                    }
                }
            }
        );
    });
}

function updateUserType(req, res, next) {
    var params = req.params;
    userInfoDAO.updateUserType(params, function (error, result) {
        if (error) {
            logger.error(' updateUserActive ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            if (result && result.affectedRows > 0) {
                resUtil.resetUpdateRes(res, result);
                return next();
            } else {
                logger.error(' updateUserType ' + result.message);
                resUtil.resInternalError(error, res, next);
            }
        }
    });
}

/**
 * update my user, user can only update his/her own records
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function updateUserById(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var authUserId = params.authUser.userId;
    var userId = params.userId;

    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }

    if (authUserId != userId) {
        resUtil.resNoAuthorizedError(null, res, next);
    }
    userInfoDAO.updateUserInfo(params, function (error, result) {
        if (error) {
            logger.error(' updateUserInfo ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            if (result && result.affectedRows > 0) {
                resUtil.resetUpdateRes(res, result);
                return next();
            } else {
                logger.error(' updateUserInfo ' + result.message);
                resUtil.resInternalError(error, res, next);
            }
        }
    });
}

function getUserInfo(req, res, next) {
    var params = req.params;
    var authUser=req.authUser;
    var tenant = params.tenant;
    var bizId = params.bizId;
    var workRows;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    userInfoDAO.getUser(params, function (error, rows) {
        if (error) {
            logger.error(' getUserInfo ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            workRows = rows;
            Seq(rows).seqEach(function (row, i) {
                var that = this;
                var roleQ = {
                    tenant: tenant,
                    userId: row.userId
                }
                roleDAO.getUserRoles(roleQ, function (error, rows) {
                    if (error) {
                        logger.error(' getUserRoles ' + error.message);
                        resUtil.resInternalError(error, res, next);
                    } else {
                        workRows[i].roles = rows;
                    }
                    that(null, i);
                })
            }).seq(function () {
                resUtil.resetQueryRes(res, workRows);
                return next();
            })
        }
    });
}

function getBizUserInfo(req, res, next) {
    var params = req.params;
    var authUser=params.authUser;
    var tenant = params.tenant;
    var bizId = params.bizId;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.bizId ==null || authUser.bizId !=bizId){
        return next(sysError.NotAuthorizedError("user is not authorized", "user is not authorized"));
    }
    userInfoDAO.getUser(params, function (error, rows) {
        if (error) {
            logger.error(' getUserInfo ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            resUtil.resetQueryRes(res, rows);
            return next();
        }
    });
}

/**
 * get my user, user id has to match auth user's id
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function getUserById(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var userId = params.userId;
    var authUserId = params.authUser.userId;
    var result;
    if (tenant == null) {
        return resUtil.resetFailedRes(res, sysMsg.TENANT_NOT_EXIST);
    }
    if (userId != authUserId) {
        return resUtil.resNoAuthorizedError(null, res, next);
    }
    userInfoDAO.getUser(params, function (error, rows) {
        if (error) {
            logger.error(' getUserById ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            if (rows && rows.length > 0) {
                result = rows[0];
            } else {
                result = rows;
            }
            //remove password
            delete result.password;
            delete result.wechatId;
            resUtil.resetQueryRes(res, result);
            return next();
        }
    });
}

function _scrubUserForTokenInfo(user) {
    var keeps = ["userId", "name", "city", "type", "userName", "phone", "bizId","email","bizName"];
    if (user) {
        for (var property in user) {
            if (user.hasOwnProperty(property)) {
                //logger.debug(property);
                //logger.debug(keeps.indexOf(property));
                if (!(keeps.indexOf(property) > -1)) {
                    delete user[property];
                }
            }
        }
    }
}
module.exports = {
    inviteUser:inviteUser,
    getInvitedUserByPhone:getInvitedUserByPhone,
    registerUser: registerUser,
    userLogin: userLogin,
    userLogOut: userLogOut,
    refreshToken: refreshToken,
    addUsers: addUsers,
    addBizUsers: addBizUsers,
    deleteUsers: deleteUsers,
    deleteBizUsers: deleteBizUsers,
    updateUsers: updateUsers,
    updateBizUsers: updateBizUsers,
    getUserById: getUserById,
    getUserInfo: getUserInfo,
    getBizUserInfo: getBizUserInfo,
    updateUserById: updateUserById,
    modifyUserPswd: modifyUserPswd,
    modifyUserPhone: modifyUserPhone,
    resetUserPswd: resetUserPswd,
    updateUsersType: updateUsersType,
    updateUsersStatus:updateUsersStatus,
    updateBizUsersStatus:updateBizUsersStatus,
    updateUsersWechatStatus:updateUsersWechatStatus
};
