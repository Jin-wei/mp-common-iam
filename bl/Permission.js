var commonUtil = require('mp-common-util');
var ReturnType = commonUtil.ReturnType;
var sysError = commonUtil.systemError;
var resUtil = commonUtil.responseUtil;
var permissionDAO = require('../dao/PermissionDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('UserInfo.js');
var Seq = require('seq');

function _updateAPermission(tenant, permission, callback){
    var permissionId = permission.permissionId;
    var description = permission.description;


    if (permissionId == null) {
        return callback(new ReturnType(false, "permissionId is missing"));
    }
    if (description == null) {
        return callback(new ReturnType(false, "description is missing"));
    }
    permissionDAO.updatePermission({tenant: tenant, permissionId: permissionId, description: description}, function (err, result) {
        var msg = null;
        if (err) {
            logger.error("update permission failed", err.message);

            return callback(new ReturnType(false, msg));
        } else {
            return callback(new ReturnType(true, null, result.insertId));
        }
    });

}

function _addAPermission(tenant, permission, callback) {
    var name = permission.name;
    var description = permission.description;

    if (name == null) {
        return callback(new ReturnType(false, "name is missing"));
    }
    if (description == null) {
        return callback(new ReturnType(false, "description is missing"));
    }
    permissionDAO.createPermission({tenant: tenant, name: name, description: description}, function (err, result) {
        var msg = null;
        if (err) {
            logger.error("add permission failed", err.message);
            if (err.message && err.message.indexOf("ER_DUP_ENTRY") > -1) {
                msg = "Permission exists already.";
            } else {
                msg = err.message;
            }
            return callback(new ReturnType(false, msg));
        } else {
            return callback(new ReturnType(true, null, result.insertId));
        }
    });
}

function _deleteAPermission(tenant, permission, callback) {
    permissionDAO.deletePermission({tenant: tenant, permissionId:permission}, function (err, result) {
        var msg = null;
        if (err) {
            logger.error("delete permission failed", err.message);
            msg = err.message;
            return callback(new ReturnType(false, msg));
        } else {
            if (result.affectedRows > 0)
                return callback(new ReturnType(true, null, permission));
            else
                return callback(new ReturnType(false,"can not delete this permission"),permission);
        }
    });
}

function addPermissions(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var permissions = params.permissions;
    var result = [];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (permissions == null) {
        return next(sysError.InvalidArgumentError("permissions is missing", "permissions is missing"));
    }

    Seq(permissions).seqEach(function (permission, i) {
        var that = this;
        console.log(permission);
        console.log(i);
        _addAPermission(tenant, permission, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })

}

function deletePermissions(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var permissions = params.permissions;
    var result = [];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (permissions == null) {
        return next(sysError.InvalidArgumentError("permissions is missing", "permissions is missing"));
    }
    Seq(permissions).seqEach(function (permission, i) {
        var that = this;
        _deleteAPermission(tenant, permission, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })

}

function getPermissions(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }

  //  logger.info(params.tenant+"2222222");
    permissionDAO.getPermission(params, function (error, result) {
        if (error) {
            logger.error('数据库查询权限异常:' + error.message);
            resUtil.resetFailedRes(res, error);
        } else {
            logger.info('获取权限成功:');
            resUtil.resetQueryRes(res, result);
        }
        next();
    });
}

function getRolesPermission(req,res,next){
    var params = req.params;

     //  logger.info('获取用户权限');
     var tenant=params.tenant;
     logger.info(params.tenant);
     if (tenant == null) {
     resUtil.resTenantNotFoundError(null, res, next);
     }

     //  logger.info(params.tenant+"111111111");
     var param = {
     tenant: params.tenant,

     roleID: params.roleID

     }

    //  logger.info(params.tenant+"2222222");
    permissionDAO.getRolesPermission(params, function (error, result) {
        if (error) {
            logger.error('数据库查询权限异常:' + error.message);
            resUtil.resetFailedRes(res, error);
        } else {
            logger.info('获取权限成功:');
            resUtil.resetQueryRes(res, result);
        }
        next();
    });


}

function updatePermissions(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var permissions = params.permissions;
    var result = [];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (permissions == null) {
        return next(sysError.InvalidArgumentError("permissions is missing", "permissions is missing"));
    }

    Seq(permissions).seqEach(function (permission, i) {
        var that = this;
        console.log(permission);
        console.log(i);
        _updateAPermission(tenant, permission, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })

}

function getTenantsPermission(req,res,next){

    var params = req.params;
    var tenant = params.tenant;

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }

    permissionDAO.getTenantsPermission(params, function (error, result) {
        if (error) {
            logger.error('数据库查询权限异常:' + error.message);
            resUtil.resetFailedRes(res, error);
        } else {
            logger.info('获取权限成功:');
            resUtil.resetQueryRes(res, result);
        }
        next();
    });

}

module.exports = {
    addPermissions: addPermissions,
    getPermissions: getPermissions,
    deletePermissions:deletePermissions,
    updatePermissions:updatePermissions,
    getRolesPermission:getRolesPermission,
    getTenantsPermission:getTenantsPermission
};