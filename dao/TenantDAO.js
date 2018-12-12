var db = require('../db/db.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('TenantDAO.js');

function createTenant(params, callback) {
    var query = 'insert into tenant(tenant,description) ' +
        ' values(?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.name;
    paramArr[i++] = params.description;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' createTenant ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function updateTenant(params, callback) {
    var query = 'update tenant set description=? where tenant=?';
    var paramArr = [], i = 0;
    paramArr[i++] = params.description;
    paramArr[i++] = params.name;

    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' updateTenant ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function softDeleteTenant(params, callback) {
    var query = 'update tenant set deleted_flag=1 where tenant=?';
    var paramArr = [], i = 0;
    paramArr[i++] = params.name;

    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' softDeleteTenant ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function getTenant(params, callback) {
    var query='select * from tenant where deleted_flag=0';
    var paramArr = [], i = 0;


    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getTenant ');
        return callback(error, rows);
    });
}

module.exports = {
    createTenant: createTenant,
    getTenant:getTenant,
    updateTenant:updateTenant,
    softDeleteTenant:softDeleteTenant
}