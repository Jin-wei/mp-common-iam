var redisDAO = require('../dao/RedisDAO.js');
var serializer = require('serializer');
var sysConfig = require('../config/SystemConfig.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('Token.js');
var userTokenDAO = require('../dao/UserTokenDAO.js');
var Seq = require('seq');

var accessTokenHeader=sysConfig.redisConfig.keyPrefix+"TOKEN";
function createAccessToken(tenant,user,deviceType,expireInSeconds,callback){
    var expireAt=null,issueAt= new Date(),tokenInfo=null,
        accessToken=null,tokenKey=null,subParams=null;
    if (expireInSeconds != null){
        expireAt=new Date(issueAt.getTime()+expireInSeconds*1000);
    }
    tokenInfo = {
        tenant:tenant,
        user:  user,
        device: deviceType,
        issueAt: issueAt,
        expireAt:expireAt
    }
    accessToken=serializer.stringify(tokenInfo);

    //cache it
    tokenKey = _getTokenKey(tenant,accessToken);
    tokenInfo.accessToken=accessToken;
    subParams = {
        key : tokenKey,
        value : JSON.stringify(tokenInfo),
        expired : expireInSeconds
    }
    redisDAO.setStringVal(subParams,function(e,success){
        if (success){
            userTokenDAO.createToken(
                {tenant:tenant,userId:user.userId,
                    deviceType:deviceType,token:accessToken,
                    issueAt:issueAt,expireAt:expireAt},function(error,rows){
                    if (error){
                        logger.error("error persist token in db");
                        return callback(error,null);
                    }
                })
            return callback(null,tokenInfo);
        }else{
           return  callback(e,null);
        }
    });

}


function getAccessToken(tenant,tokenString,callback){
    var tokenKey = _getTokenKey(tenant,tokenString);
    redisDAO.getStringVal({key:tokenKey},function(error,result){
        if(error){
            callback(null);
        }else {
            callback(JSON.parse(result));
        }
    })
}

function removeAccessToken(tenant,tokenString,callback){
    var tokenKey = _getTokenKey(tenant,tokenString);
    redisDAO.removeStringVal({key:tokenKey},function(error,result){
        if(error){
            logger.error('remove token from redis failed ' + error.message);
            callback(false);
        }else {
            userTokenDAO.expireToken({tenant:tenant,token:tokenString},function(error,rows){
                if (error){
                    logger.error('expried token in DB failed');
                }
            })
            logger.info('remove token from redis succeed');
            callback(true);
        }
    })
}

function removeUserTokens(options,callback){
    var tenant=options.tenant, userId=options.userId;
    userTokenDAO.getActiveTokens(options,function(err, rows) {
        if (rows && rows.length > 0) {
            Seq(rows).parEach(function (tokenRow, i) {
                var that=this;
                removeAccessToken(tenant, tokenRow.token, function (success) {
                    if (success) {
                        that(null, i);
                    }else{
                        that(new Error("error remove user token"),i)
                    }
                })
            }).catch(function (err) {
                return callback(err);
            }).seq(function(){
                return callback(null,rows.length);
            })
        }
        return callback(null);
    });
}

function _getTokenKey(tenant,tokenString){
    return accessTokenHeader+tenant+tokenString;
}



module.exports = {
    createAccessToken:createAccessToken,
    getAccessToken: getAccessToken,
    removeAccessToken: removeAccessToken,
    removeUserTokens:removeUserTokens
}