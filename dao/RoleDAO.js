var db = require('../db/db.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('RoleDAO.js');

function createRole(params, callback) {
    var query = 'insert into role(tenant,name,description,system_flag) ' +
        ' values(?,?,?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.name;
    paramArr[i++] = params.description;
    paramArr[i++] = (params.systemFlag == null) ? 0 : params.systemFlag;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' createPermission+Role ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function updateRole(params, callback) {
    var query = 'update role set name=?,description=? ' +
        ' where tenant=? and id=? and system_flag=0';
    var paramArr = [], i = 0;

    paramArr[i++] = params.name;
    paramArr[i++] = params.description;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.roleId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' updateRole ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })

}

function deleteRole(params, callback) {
    var query = 'delete from role ' +
        ' where tenant=? and id=? and system_flag=0;';
    var paramArr = [], i = 0;

    paramArr[i++] = params.tenant;
    paramArr[i++] = params.roleId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' deleteRole ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })

}

function getUserRole(params, callback) {
    var query = 'select r.id roleId,r.name,r.description,' +
        ' r.system_flag systemFlag ' +
        'from user_role ur, role r where r.id=ur.role_id and r.tenant=? and ur.user_id=?';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getUserRole ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function getUserPermissions(params, callback) {
    var query = 'select distinct p.id permissionId,p.name,p.description,p.system_flag systemFlag from user_role ur,role_permission rp, permission p where ur.role_id=rp.role_id and rp.permission_id=p.id ' +
        ' and ur.tenant=? and ur.user_id=?';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getUserPermissions ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function getTenantPermissions(params, callback) {
    var query = 'select distinct p.id permissionId,p.name,p.description, p.system_flag systemFlag from  permission p ' +
        'where p.tenant=? ';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getTenantPermissions ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function getUserRoles(params, callback) {
    var query = "select r.id roleId, r.name, r.description, r.system_flag systemFlag from user_role ur,role r where ur.role_id=r.id " +
        "and ur.tenant=? and ur.user_id=?";
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;

    if (params.start != null && params.size != null) {
        paramArr[i++] = Number(params.start);
        paramArr[i++] = Number(params.size);
        query = query + " limit ? , ? "
    }

    db.dbQuery(query, paramArr, function (error, rows) {
        if (error) {
            logger.error(error.message);
        }
        logger.debug(' getUserRoles ');
        return callback(error, rows);
    })
}

function addUserRoleRel(params, callback) {
    var query = 'insert into user_role(tenant,user_id,role_id) ' +
        ' values(?,?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;
    paramArr[i++] = params.roleId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' addUserRoleRel ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function deleteUserRoleRel(params, callback) {
    var query = 'delete from user_role where tenant=? and user_id=? and role_id=? ';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;
    paramArr[i++] = params.roleId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' deleteUserRoleRel ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function clearUserRoleRel(params, callback) {
    var query = 'delete from user_role where tenant=? and user_id=?';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.userId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' clearUserRoleRel ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function addRolePermissionRel(params, callback) {
    var query = 'insert into role_permission(tenant,role_id,permission_id) ' +
        ' values(?,?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.roleId;
    paramArr[i++] = params.permissionId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' addRolePermissionRel ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function deleteRolePermissionRel(params, callback) {
    var query = 'delete from role_permission where tenant=? and role_id=? and permission_id=? ';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.roleId;
    paramArr[i++] = params.permissionId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' deleteRolePermissionRel ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function clearRolePermissionRel(params, callback) {
    var query = 'delete from role_permission where tenant=? and role_id=?';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.roleId;
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' clearRolePermissionRel ');
        if (error) {
            logger.error(error.message);
        }
        return callback(error, rows);
    })
}

function getRolesByTenant(params, callback) {
    var query = 'select *  from role where tenant=? ';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;

    if (params.roleId != null) {
        query = query + " and id = ? ";
        paramArr[i++] = params.roleId;
    }

    if (params.start != null && params.size != null) {
        paramArr[i++] = Number(params.start);
        paramArr[i++] = Number(params.size);
        query = query + " limit ? , ? "
    }


    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getRolesByTenant ');
        if (error) {
            logger.error(error.message);
        }

        return callback(error, rows);
    })

}

module.exports = {
    createRole: createRole,
    addUserRoleRel: addUserRoleRel,
    deleteUserRoleRel: deleteUserRoleRel,
    clearUserRoleRel: clearUserRoleRel,
    addRolePermissionRel: addRolePermissionRel,
    deleteRolePermissionRel: deleteRolePermissionRel,
    clearRolePermissionRel: clearRolePermissionRel,
    getUserPermissions: getUserPermissions,
    getUserRoles: getUserRoles,
    getTenantPermissions: getTenantPermissions,
    getRolesByTenant: getRolesByTenant,
    updateRole: updateRole,
    deleteRole: deleteRole
}
