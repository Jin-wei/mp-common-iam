var commonUtil = require('mp-common-util');
var ReturnType = commonUtil.ReturnType;
var sysError = commonUtil.systemError;
var resUtil = commonUtil.responseUtil;
var roleDAO = require('../dao/RoleDAO.js');
var userInfoDAO = require('../dao/UserInfoDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('UserInfo.js');
var Seq = require('seq');



function _updateARole(tenant,role,callback){
    var name=role.name;
    var description= role.description;
    var roleId=role.roleId;

    if (name==null){
        return callback(new ReturnType(false,"name is missing"));
    }
    if (description==null){
        return callback(new ReturnType(false,"description is missing"));
    }
    roleDAO.updateRole({tenant:tenant,roleId:roleId,name:name,description:description},function(err,result){
        var msg=null;
        if (err){
            logger.error("update role failed",err.message);

                msg=err.message;

            return callback(new ReturnType(false,msg));
        }else{
            return callback(new ReturnType(true,null,roleId));
        }
    });

}

function _addARole(tenant,role,callback){
    var name=role.name;
    var description= role.description;

    if (name==null){
        return callback(new ReturnType(false,"name is missing"));
    }
    if (description==null){
        return callback(new ReturnType(false,"description is missing"));
    }
    roleDAO.createRole({tenant:tenant,name:name,description:description},function(err,result){
        var msg=null;
        if (err){
            logger.error("add role failed",err.message);
            if (err.message && err.message.indexOf("ER_DUP_ENTRY")>-1){
                msg="Role exists already.";
            }else{
                msg=err.message;
            }
            return callback(new ReturnType(false,msg));
        }else{
            return callback(new ReturnType(true,null,result.insertId));
        }
    });
}

function putRoles(req,res,next){
    var params=req.params;
    var tenant=params.tenant;
    var roles=params.roles;

    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (roles==null){
        return next(sysError.InvalidArgumentError("roles is missing", "roles is missing"));
    }

    Seq(roles).seqEach(function(role,i){
        var that=this;
        _updateARole(tenant,role,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })

}


function addRoles(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var roles = params.roles;
    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (roles==null){
        return next(sysError.InvalidArgumentError("roles is missing", "roles is missing"));
    }

    Seq(roles).seqEach(function(role,i){
        var that=this;
        _addARole(tenant,role,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })

}

function assignUserRole(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var userId = params.userId;
    var roles = params.roles;
    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }

    roleDAO.clearUserRoleRel({userId:userId,tenant:tenant},function(error,rows){
      var msg=null;
      if (error){
          logger.error("clear user role rel failed",error.message);
          msg=error.message;
          resUtil.resetFailedRes(res,msg);
          return next();
      }else{
        Seq(roles).seqEach(function(role,i){
            var that=this;
            _addUserRoleRel(tenant,userId,role,function(returnResult){
                result[i]=returnResult;
                that(null,i);
            });
        }).seq(function(){
            resUtil.resetQueryRes(res,result,null);
            return next();
        })
      }
    })
}

function _addUserRoleRel(tenant,userId,roleId,callback){
    roleDAO.addUserRoleRel({userId:userId,roleId:roleId,tenant:tenant},function(error,result){
        if (error) {
            return callback(new ReturnType(false, error.message));
        }else{
            return callback(new ReturnType(true,result.insertId));
        }
    })
}

//biz user assign role
function assignBizUserRole(req, res, next) {
    var params = req.params;
    var authUser=params.authUser;
    var tenant = params.tenant;
    var roleId = params.roleId;
    var userId = params.userId;
    var bizId = params.bizId;

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (authUser.bizId ==null || authUser.bizId !=bizId){
        return resUtil.resNoAuthorizedError(null, res, next);
    }

    userInfoDAO.getUser({tenant:tenant,bizId:bizId,userId:userId}, function (error, rows) {
        if (error) {
            logger.error(' getUserInfo ' + error.message);
            resUtil.resInternalError(error, res, next);
        }
        //user is not found
        if (rows==null || rows.length<=0){
            return resUtil.resNoAuthorizedError(null, res, next);
        }
        //assign role
        roleDAO.addUserRoleRel({userId:userId,tenant:tenant,roleId:roleId},function(error,rows){
            var msg=null;
            if (error){
                logger.error("add user role rel failed",error.message);
                if (error.message && error.message.indexOf("ER_DUP_ENTRY")>-1){
                    msg="User has this role already";
                }else{
                    msg=error.message;
                }
                resUtil.resetFailedRes(res,msg);
                return next();
            }else{
                resUtil.resetSuccessRes(res);
                return next();
            }
        })
    });
}

function deleteUserRole(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var roleId = params.roleId;
    var userId = params.userId;

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }

    roleDAO.deleteUserRoleRel({userId:userId,roleId:roleId,tenant:tenant},function(error,rows){
        if (error){
            logger.error("delete user role rel failed",error.message);
            resUtil.resetFailedRes(res,error.message);
            return next();
        }else{
            resUtil.resetSuccessRes(res);
            return next();
        }
    })
}

function _addARolePermission(tenant,roleId,permissionId,callback){
    roleDAO.addRolePermissionRel({tenant:tenant, roleId:roleId, permissionId: permissionId},function(error,result){
        if (error) {
            return callback(new ReturnType(false, error.message));
        }else{
            return callback(new ReturnType(true,result.insertId));
        }
    })
}

function _deleteARolePermission(tenant,roleId,permissionId,callback){
    roleDAO.deleteRolePermissionRel({tenant:tenant, roleId:roleId, permissionId: permissionId},function(error,result){
        if (error) {
            return callback(new ReturnType(false, error.message));
        }else{
            return callback(new ReturnType(true,result.insertId));
        }
    })
}

function assignRolePermissions(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var roleId = params.roleId;
    var permissions = params.permissions;
    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (permissions==null){
        return next(sysError.InvalidArgumentError("permissions is missing", "permissions is missing"));
    }

    roleDAO.clearRolePermissionRel({tenant:tenant, roleId:roleId},function(error,result){
        if (error) {
          resUtil.resetFailedRes(res,error.message);
          return next();
        }else{
          Seq(permissions).seqEach(function(permission,i){
              var that=this;
              _addARolePermission(tenant,roleId,permission,function(returnResult){
                  result[i]=returnResult;
                  that(null,i);
              });
          }).seq(function(){
              resUtil.resetQueryRes(res,result,null);
              return next();
          })
        }
    })
}

function deleteRolePermissions(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var roleId = params.roleId;
    var permissions = params.permissions;
    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (permissions==null){
        return next(sysError.InvalidArgumentError("permissions is missing", "permissions is missing"));
    }

    Seq(permissions).seqEach(function(permission,i){
        var that=this;
        _deleteARolePermission(tenant,roleId,permission,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function getRolesByTenant(req,res,next) {
    var params = req.params;
    var tenant = params.tenant;

    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    roleDAO.getRolesByTenant(params, function (error, rows) {
        if (error) {
            logger.error(' getRolesByTenant ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            if (rows && rows.length > 0) {
                result = rows;
            } else {
                result = rows;
            }//remove password

            resUtil.resetQueryRes(res, result);
            return next();
        }
    });

}

function getUserRoles(req,res,next){
    var params = req.params;
    var tenant = params.tenant;
    var userId = params.userId;

    var result=[];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    roleDAO.getUserRoles(params, function (error, rows) {
        if (error) {
            logger.error(' getUserRoles ' + error.message);
            resUtil.resInternalError(error, res, next);
        } else {
            if (rows && rows.length > 0) {
                result = rows;
            } else {
                result = rows;
            }//remove password

            resUtil.resetQueryRes(res, result);
            return next();
        }
    });
}

function deleteRoles(req, res, next) {
    var params = req.params;
    var tenant = params.tenant;
    var roles = params.roles;
    var result = [];

    //validation
    if (tenant == null) {
        resUtil.resTenantNotFoundError(null, res, next);
    }
    if (roles == null) {
        return next(sysError.InvalidArgumentError("roles are missing", "roles are missing"));
    }
    Seq(roles).seqEach(function (role, i) {
        var that = this;
        _deleteARole(tenant, role, function (returnResult) {
            result[i] = returnResult;
            that(null, i);
        });
    }).seq(function () {
        resUtil.resetQueryRes(res, result, null);
        return next();
    })
}

function _deleteARole(tenant, role, callback) {
    roleDAO.deleteRole({tenant: tenant, roleId:role}, function (err, result) {
        var msg = null;
        if (err) {
            logger.error("delete role failed", err.message);
            msg = err.message;
            return callback(new ReturnType(false, msg));
        } else {
            if (result.affectedRows > 0)
                return callback(new ReturnType(true, null, role));
            else
                return callback(new ReturnType(false,"role can not be deleted"),role);
        }
    });
}


function getConnectState(req,res,next){
    res.send(200,{success: true});
}
module.exports = {
    getConnectState:getConnectState,
    addRoles: addRoles,
    assignUserRole: assignUserRole,
    deleteUserRole: deleteUserRole,
    assignRolePermissions:assignRolePermissions,
    deleteRolePermissions:deleteRolePermissions,
    assignBizUserRole: assignBizUserRole,
    getRolesByTenant:getRolesByTenant,
    putRoles:putRoles,
    getUserRoles:getUserRoles,
    deleteRoles:deleteRoles
};
