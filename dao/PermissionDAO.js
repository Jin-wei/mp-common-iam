var db = require('../db/db.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('PermissionDAO.js');

function createPermission(params, callback) {
    var query = 'insert into permission(tenant,name,description,system_flag) ' +
        ' values(?,?,?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.name;
    paramArr[i++] = params.description;
    paramArr[i++] = (params.systemFlag==null)?0:1;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' createPermission ');
        return callback(error, rows);
    })
}

function updatePermission(params,callback){
    var query = 'update permission set description=? ' +
        ' where tenant=? and id=? and system_flag=0;';
    var paramArr = [], i = 0;

    paramArr[i++] = params.description;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.permissionId;

    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' updatePermission ');
        return callback(error, rows);
    })

}

function deletePermission(params, callback) {
    var query = 'delete from permission where tenant=? and id=? and system_flag=0 ';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.permissionId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' deletePermission ');
        return callback(error, rows);
    })
}

function getPermission(params, callback) {
    var query = 'SELECT * from permission where tenant=?';
    var paramArr = [], i = 0;

    paramArr[i++] = params.tenant;
    if (params.name !=null){
        query+=" and name like ?"
        paramArr[i++] = '%'+params.name+'%';
    }

    if(params.start!=null && params.size !=null){ 
        paramArr[i++] = Number(params.start); 
        paramArr[i++] = Number(params.size); 
        query = query + " limit ? , ? " 
    }


    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getPermisssion ');
        callback(error, rows);
    });
}

function getTenantsPermission(params,callback){

    var query = 'SELECT * from permission where tenant=? order by id';
    var paramArr = [], i = 0;
    paramArr[i++]=params.tenant;


    if(params.start!=null && params.size !=null){
        paramArr[i++] = Number(params.start);
        paramArr[i++] = Number(params.size);
        query = query + " limit ? , ? "
    }

    logger.info('Query: ' + query);
    logger.info('Param: ' + paramArr);
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getTenantsPermisssion ');
        callback(error, rows);
    });

}

function getRolesPermission(params, callback){
    var query = 'select * from role_permission rp,permission p where rp.permission_id=p.id and rp.tenant=? and rp.role_id=? ';
    var paramArr = [], i = 0;
    paramArr[i++]=params.tenant;
    paramArr[i++]=params.roleId;

    if(params.start!=null && params.size !=null){
        paramArr[i++] = Number(params.start);
        paramArr[i++] = Number(params.size);
        query = query + " limit ? , ? "
    }

    logger.info('Query: ' + query);
    logger.info('Param: ' + paramArr);
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getRolesPermisssion ');
        callback(error, rows);
    });

}

module.exports = {
    createPermission: createPermission,
    getPermission: getPermission,
    deletePermission:deletePermission,
    updatePermission:updatePermission,
    getRolesPermission:getRolesPermission,
    getTenantsPermission:getTenantsPermission
}