var mysql = require('mysql');
var sysConfig = require('../config/SystemConfig.js');

var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('db.js');

var pool  = mysql.createPool(sysConfig.getMysqlConnectOptions());

var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};


var dbQuery = function(sql,values,callback){
    pool.getConnection(function(conError,con){
        if(conError){
            logger.error("Connect mysql error :",conError.message);
            callback(conError,null);
        }else{
            logger.debug(con.format(sql,values));
            con.query(sql,values,function(error, rows){
                if(error){
                    logger.error("Execute mysql query error :"+con.format(sql,values) +"\n" + error.message);
                    con.rollback();
                }
                con.release();
                callback(error,rows);
            })
        }
    })

}


exports.getCon = getConnection;

module.exports = {
    getCon: getConnection,
    dbQuery : dbQuery
};
