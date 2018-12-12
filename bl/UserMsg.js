/**
 * Created by ling xue on 2016/3/7.
 */
var commonUtil = require('mp-common-util');
var sysError = commonUtil.systemError;
var resUtil = commonUtil.responseUtil;
var encrypt = commonUtil.encrypt;
var redisDAO = require('../dao/RedisDAO.js');
var sysConfig = require('../config/SystemConfig.js');
var listOfValue = require('../util/ListOfValue.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('UserMsg.js');
var sms = require('../util/SmsUtil.js').sms;
var nodemailer = require("nodemailer");
var fromEmail = sysConfig.systemMailConfig.fromEmail ;
var transport = nodemailer.createTransport(sysConfig.systemMailConfig.smtp, sysConfig.systemMailConfig.options);
var activateUserUrl=sysConfig.systemMailConfig.activateUserUrl;
var mailTemplateUtil = require('./../util/MailTemplateUtil.js');
var userInfoDAO = require('../dao/UserInfoDAO.js');
var EMAILCAPTCHAVALSEPERATOR="|";

/**
 * send random key sms to new user phone,before check user phone .
 * @param req
 * @param res
 * @param next
 */
function sendSmsCaptcha(req, res, next) {
    //mova all these to rabbit queue if hit performance issue
    var params = req.params;
    var tenant=params.tenant,smsType=params.smsType,phone=params.phone,subParams = {};
    var captchaKey = encrypt.getSmsRandomKey();
    if (tenant==null){
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (phone==null){
        return next(sysError.MissingParameterError("phone is missing", "phone is missing"));
    }

    if (smsType==null){
        return next(sysError.MissingParameterError("smsType is missing", "smsType is missing"));
    }
    if(smsType ==listOfValue.SMS_REG_TYPE) {
        subParams.expired = listOfValue.EXPIRED_TIME_REG_SMS;
        subParams.key = listOfValue.CACHE_APPEND_REG + tenant + params.phone;
        subParams.value = captchaKey;
    }else if (smsType ==listOfValue.SMS_PSWD_TYPE){
        subParams.expired = listOfValue.EXPIRED_TIME_PSWD_SMS;
        subParams.key = listOfValue.CACHE_APPEND_RESETPWD + tenant + params.phone;
        subParams.value = captchaKey;
    }else if (smsType ==listOfValue.SMS_PHONE_TYPE){
        subParams.expired = listOfValue.EXPIRED_TIME_PHONE_SMS;
        subParams.key = listOfValue.CACHE_APPEND_CHANGPHONE + tenant + params.phone;
        subParams.value = captchaKey;
    }else{
        return next(sysError.InvalidArgumentError("invalid smsType", "invalid smsType"));
    }
    //should run parallel?
    redisDAO.setStringVal(subParams, function (error, result) {
        if (error) {
            logger.error('setCaptchaKey' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            logger.info('setCaptchaKey: ' + ' succeed');
            if (sysConfig.smsOptions.enabled) {
                try {
                    //is it a async call?
                    sms.send(phone, {"templateId": sysConfig.smsOptions.captchaTemplateId,
                        "datas": [subParams.value , subParams.expired / 60 + '分钟']});
                } catch (err) {
                    logger.error(err);
                }
                resUtil.resetSuccessRes(res);
            }else{
                return resUtil.resetCreateRes(res,{insertId:captchaKey},null);
            }
        }
    })
}

/**
 * send random key sms to new user email,before check user email .
 * @param req
 * @param res
 * @param next
 */
function sendEmailCaptcha(req, res, next) {
    //mova all these to rabbit queue if hit performance issue
    var params = req.params;
    var tenant=params.tenant,emailType=params.emailType,email=params.email;
    if (tenant==null){
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (email==null){
        return next(sysError.MissingParameterError("email is missing", "email is missing"));
    }
    if (emailType==null){
        return next(sysError.MissingParameterError("emailType is missing", "emailType is missing"));
    }
    //generate email key
    if(emailType ==listOfValue.EMAIL_ACTIVEUSER_TYPE) {
        sendActivateUserEmail({tenant: tenant, email: email}, function (error) {
            if (error) {
                resUtil.resetFailedRes(res, error.message, next);
            } else {
                resUtil.resetSuccessRes(res, next);
            }
        });
    }

}

function sendActivateUserEmail(options,callback) {
    var subParams = {};
    var tenant = options.tenant;
    var email = options.email;
    var activateUrl=

    subParams.value = listOfValue.CACHE_APPEND_EMAILACTIVEUSER
        + EMAILCAPTCHAVALSEPERATOR + tenant + EMAILCAPTCHAVALSEPERATOR + email;
    subParams.expired = listOfValue.EXPIRED_TIME_ACTIVEUSER_EMAIL;
    subParams.key = encrypt.encryptByMd5(subParams.value);
    //should run parallel?
    redisDAO.setStringVal(subParams, function (error, result) {
        if (error) {
            logger.error('setCaptchaKey' + error.message);
            callback(error);
        } else {
            mailTemplateUtil.createActiveUserTemplate({tenant:tenant, email:email, activeCode:subParams.key,ActiveUserUrl:activateUserUrl},
                function(error,data){
                if (error){
                    callback(error);
                }
                logger.info('to:'+options.email);
                transport.sendMail({
                    from : fromEmail,
                    to : options.email,
                    subject: "test",
                    generateTextFromHTML : false,
                    html : data
                }, function(error, response){
                    //console.log("trying to send to email........");
                    if(error){
                        logger.error(' sendActiveEmail failed:'+ error.message);
                        transport.close();
                        callback(error.message);
                    }else{
                        transport.close();
                    }
                    callback(null);

                });
            });
        }
    })
}

function activateUserByEmail(req, res, next) {
    var params = req.params;
    var activateCode = params.activateCode;
    if (activateCode == null) {
        return next(sysError.MissingParameterError("activateCode is missing", "activateCode is missing"));
    }

    redisDAO.getStringVal({key: activateCode}, function (error, result) {
        if (error) {
            logger.error('getEmailActivateCode ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            if (result == null) {
                logger.warn(' activateUser by email error: ' + activateCode);
                resUtil.resetFailedRes(res, "invalid activate code");
                return next();
            } else {
                //parse the value to get email and tenant information
                var arr = result.split(EMAILCAPTCHAVALSEPERATOR);
                if (arr.length != 3) {
                    logger.warn(' activateUser by email error: ' + activateCode);
                    resUtil.resetFailedRes(res, "invalid activate code");
                    return next();
                }
                else if (listOfValue.CACHE_APPEND_EMAILACTIVEUSER != arr[0]) {
                    logger.warn(' activateUser by email error: ' + activateCode);
                    resUtil.resetFailedRes(res, "invalid activate code");
                    return next();
                }
                userInfoDAO.activateUserByEmail({tenant:arr[1], email:arr[2]}, function (err, rows) {
                    if (err) {
                        logger.error(' activateUser by email error: ' + err.message);
                        return resUtil.resetFailedRes(res, err.message, next);
                    } else {
                        if (rows.affectedRows > 0) {
                            return resUtil.resetSuccessRes(res, next);
                        } else {
                            logger.error('no user is activated');
                            return resUtil.resetFailedRes(res, "no user is activated", next);
                        }
                    }
                })
            }
        }
    });
}

module.exports = {
    sendSmsCaptcha: sendSmsCaptcha,
    sendEmailCaptcha: sendEmailCaptcha,
    activateUserByEmail:activateUserByEmail,
    sendActivateUserEmail:sendActivateUserEmail
};