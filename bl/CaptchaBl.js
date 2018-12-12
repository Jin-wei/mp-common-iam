/**
 * Created by xueling on 16/4/28.
 */
var commonUtil = require('mp-common-util');
var sysMsg = commonUtil.systemMsg;
var sysError = commonUtil.systemError;
var resUtil = commonUtil.responseUtil;
var listOfValue = require('../util/ListOfValue.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('CaptchaBl.js');
var Seq = require('seq');
var captcha = require('../util/Captcha.js');
var redisDAO = require('../dao/RedisDAO.js');

function createCaptcha(req ,res,next){
    var params = req.params;
    var token = req.headers[listOfValue.USER_REQUEST_HEAD_CLIENT];
    if(token ==null){
        res.send(404);
        return next();
    }
    captcha({noise:false},function(text,data){
        logger.info(' createCaptcha ' + text);
        var subParams = {}
        subParams.expired = listOfValue.EXPIRED_TIME_CAPTCHA;
        subParams.key = listOfValue.CACHE_APPEND_CPATCHA+token;
        subParams.value = text;
        redisDAO.setStringVal(subParams,function(error,result){
            if(error){
                logger.error('createCaptcha set cache ' + error.message);
            }else{
                logger.info('createCaptcha ' + ' success');
            }
        });
        resUtil.resetQueryRes(res,{captcha:data},null);
        return next();
    });

}

function validateCaptcha(req,res,next){
    var params = req.params;
    var token = listOfValue.CACHE_APPEND_CPATCHA+req.headers[listOfValue.USER_REQUEST_HEAD_CLIENT];

    redisDAO.getStringVal({key:token},function(error,result){
        if(error){
            logger.error('createRegCaptcha ' + error.message);
            resUtil.resInternalError(error,res,next);
        }else {
            if (params.captcha == result) {
                return next();
            } else {
                resUtil.resetFailedRes(res, "验证码错误");
                return next();
            }
        }
    })
}

module.exports ={
    createCaptcha : createCaptcha ,
    validateCaptcha :  validateCaptcha
}
