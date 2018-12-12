/**
 * Created by Jie Zou on 2016/8/29.
 */

var db = require('../db/db.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('UserTokenDAO.js');
function createToken(params, callback) {

    var query = 'insert into user_token(tenant,user_id,device_type,token,issue_at,expire_at) ' +
        ' values(?,?,?,?,?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;
    paramArr[i++] = params.deviceType;
    paramArr[i++] = params.token;
    paramArr[i++] = params.issueAt;
    paramArr[i++] = params.expireAt;

    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' createToken ');
        return callback(error, rows);
    })
}

function expireToken(params, callback) {
    var query = 'update user_token set expire_at = now() where expire_at>now() and tenant=? '
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    if (params.token){
        query +=" and token=?"
    }
    paramArr[i++] = params.token;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' expireToken ');
        return callback(error, rows);
    })
}

function getActiveTokens(params, callback) {
    var query = 'select tenant, user_id userId, device_type deviceTye, token, issue_at issueAt, expire_at expireAt from user_token' +
        ' where expire_at>now() and tenant=? '
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    if (params.token !=null){
        query +=" and token=? "
        paramArr[i++] = params.token;
    }
    if (params.userId !=null){
        query +=" and user_id=? "
        paramArr[i++] = params.userId;
    }

    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getActiveTokens ');
        return callback(error, rows);
    })
}

module.exports = {
    createToken: createToken,
    expireToken:expireToken,
    getActiveTokens:getActiveTokens
};