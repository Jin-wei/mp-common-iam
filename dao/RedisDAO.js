/**
 * Created by xueling on 16/4/27.
 */
var redisCon = require('../db/RedisCon.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('RedisDAO.js');
var listOfValue = require('../util/ListOfValue.js');

function setStringVal(params,callback) {
    try {
        if (params.expired) {
            redisCon.set(params.key, params.value,'EX',params.expired);
        }else{
            redisCon.set(params.key, params.value);
        }
        return callback(null,true);
    } catch (e) {
       return  callback(e,false);
    }
}

function getStringVal(params, callback) {
    //todo remove this hard coded value
   /* if (params.key.startsWith(listOfValue.CACHE_APPEND_REG) || params.key.startsWith(listOfValue.CACHE_APPEND_RESETPWD)
        || params.key.startsWith(listOfValue.CACHE_APPEND_CHANGPHONE)){
        return callback(null,"1234");
    }*/
    redisCon.get(params.key, function (error, result) {
        console.log("abcdeffffffffffffffffffffffff");
        logger.debug('getStringVal');
        return callback(error, result);
    });
}

function removeStringVal(params,callback){
    redisCon.del(params.key,function(error,result){
        logger.debug('removeStringVal');
        callback(error, result);
    })
}

function expireStringVal(params){
    redisCon.expire(params.key, params.expired);
}

module.exports = {
    setStringVal: setStringVal,
    getStringVal: getStringVal ,
    removeStringVal : removeStringVal ,
    expireStringVal : expireStringVal
};