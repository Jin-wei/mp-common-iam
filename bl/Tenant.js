var commonUtil = require('mp-common-util');
var ReturnType = commonUtil.ReturnType;
var sysError = commonUtil.systemError;
var resUtil = commonUtil.responseUtil;
var tenantDAO = require('../dao/TenantDAO.js');
var permissionDAO = require('../dao/PermissionDAO.js');
var roleDAO = require('../dao/RoleDAO.js');
var userInfoDAO = require('../dao/UserInfoDAO.js');
var serverLogger = require('../util/ServerLogger.js');
var listOfValue = require('../util/ListOfValue.js');
var logger = serverLogger.createLogger('Tenant.js');
var encrypt = commonUtil.encrypt;
var Seq = require('seq');

function _createTenantPermissions(permissions, callback){
    var result=[];
    Seq(permissions).seqEach(function(permission,i) {
        var that = this;
        permissionDAO.createPermission(permissions[i], function (err, rows) {
            if (err) {
                result[i] = new ReturnType(false, err.message);
            } else {
                result[i] = new ReturnType(true, null, rows.insertId);
            }
            that(null, i);
        })
    });
    callback(null, result);
}

function _addATenant(tenant,callback){
    var name=tenant.name;
    var description= tenant.description;
    var adminUserName=tenant.adminUserName;
    var adminPassword= tenant.adminPassword;

    if (name==null){
        return callback(new ReturnType(false,"name is missing"));
    }
    if (description==null){
        return callback(new ReturnType(false,"description is missing"));
    }

    if (adminUserName==null){
        return callback(new ReturnType(false,"adminUserName is missing"));
    }
    if (adminPassword==null){
        return callback(new ReturnType(false,"adminPassword is missing"));
    }

    var adminRoleId, adminUserId;
    Seq().seq(function(){
        var that=this;
        tenantDAO.createTenant({name:name,description:description},function (err,result){
            if (err){
                logger.error("add tenant failed",err.message);
                if (err.message && err.message.indexOf("ER_DUP_ENTRY")>-1){
                    msg="tenants exists already.";
                }else{
                    msg=err.message;
                }
                return callback(new ReturnType(false,msg));
            }else{
                //next step
                that();
            }
        })
    }).seq(function() {
        //add admin role
        var that = this;
        roleDAO.createRole({tenant: name, name: listOfValue.ROLE_AMDIN, description: "admin role",systemFlag:true}, function (err, result) {
            if (err) {
                logger.error("add tenant admin role failed", err.message);
                if (err.message && err.message.indexOf("ER_DUP_ENTRY") > -1) {
                    msg = "tenant admin role exists already.";
                } else {
                    msg = err.message;
                }
                return callback(new ReturnType(false, msg));
            } else {
                adminRoleId = result.insertId;
                that();
            }
        })
    }).seq(function() {
        //create permissions
        var that = this;
        var parray=[{tenant: name, name: listOfValue.PERMISSION_CREATE_USERS, description: "create users",systemFlag:true},
                    {tenant: name, name: listOfValue.PERMISSION_DELETE_USERS, description: "delete users",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_GET_USERS, description: "get users",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_UPDATE_USERS, description: "update users",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_CREATE_ROLES, description: "create roles",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_UPDATE_ROLES, description: "update roles",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_DELETE_ROLES, description: "delete roles",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_CREATE_PERMISSIONS, description: "create permissions",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_UPDATE_PERMISSIONS, description: "update permissions",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_DELETE_PERMISSIONS, description: "delete permissions",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_ASSIGN_USERROLES, description: "assign user roles",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_ASSIGN_ROLEPERMISSIONS, description: "assign role permissions",systemFlag:true},
            {tenant: name, name: listOfValue.PERMISSION_ASSIGN_BIZ_USERROLES, description: "biz admin assign role to biz user",systemFlag:true}
            ]

        _createTenantPermissions(parray,function (err,rows){
            if (err){
                return callback(new ReturnType(false, err.msg));
            }
            logger.info("created permissions:");
            logger.info(rows);
            that();
        })
    }).seq(function(){
            //add admin user
            var that =this;
            userInfoDAO.createUser({tenant:name,username:adminUserName,password: encrypt.encryptByMd5(adminPassword),
                type:listOfValue.USER_TYPE_INTERNAL,status:listOfValue.USER_STATUS_ACTIVE},function(err, result){
                if (err){
                    logger.error("add admin user failed",err.message);
                    if (err.message && err.message.indexOf("ER_DUP_ENTRY")>-1){
                        msg="tenant admin user exists already.";
                    }else{
                        msg=err.message;
                    }
                    return callback(new ReturnType(false,msg));
                }else{
                    adminUserId=result.insertId;
                    that();
                }
            })
        }).seq(function(){
            //assign admin user admin roles
            var that = this;
            roleDAO.addUserRoleRel({tenant:name,roleId:adminRoleId,userId:adminUserId},function (err,result){
                if (err){
                    return callback(new ReturnType(false,err.message));
                }else{
                    return callback(new ReturnType(true,null,name));
                }
            })
        })
}

function getTenants(req, res, next){

    var params = req.params;
    var result=[];


    tenantDAO.getTenant(params, function (error, rows) {
        if (error) {
            logger.error(' getTenant ' + error.message);
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

function addTenants(req, res, next) {
    var params = req.params;
    var tenants = params.tenants;
    var result=[];

    //validation
    if (tenants==null){
        return next(sysError.InvalidArgumentError("tenants is missing", "tenants is missing"));
    }

    Seq(tenants).seqEach(function(tenant,i){
        var that=this;
        _addATenant(tenant,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function updateTenants(req, res, next) {
    var params = req.params;
    var tenants = params.tenants;
    var result=[];

    //validation
    if (tenants==null){
        return next(sysError.InvalidArgumentError("tenants is missing", "tenants is missing"));
    }

    Seq(tenants).seqEach(function(tenant,i){
        var that=this;
        _updateATenant(tenant,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _updateATenant(tenant,callback) {
    var name = tenant.name;
    var description = tenant.description;

    if (name == null) {
        return callback(new ReturnType(false, "name is missing"));
    }
    if (description == null) {
        return callback(new ReturnType(false, "description is missing"));
    }
    tenantDAO.updateTenant(tenant, function (error, row) {
        if (error) {
            logger.error(' updateTenant ' + error.message);
            return callback(new ReturnType(false, error.message,name));
        } else {
            if (row.affectedRows > 0){
                return callback(new ReturnType(true, null,name));
            }else {
                return callback(new ReturnType(false, null, name));
            }
        }
    });
}

function deleteTenants(req, res, next) {
    var params = req.params;
    var tenants = params.tenants;
    var result=[];

    //validation
    if (tenants==null){
        return next(sysError.InvalidArgumentError("tenants is missing", "tenants is missing"));
    }

    Seq(tenants).seqEach(function(tenant,i){
        var that=this;
        _deleteATenant(tenant,function(returnResult){
            result[i]=returnResult;
            that(null,i);
        });
    }).seq(function(){
        resUtil.resetQueryRes(res,result,null);
        return next();
    })
}

function _deleteATenant(tenant,callback) {
    var name = tenant.name;
    if (name == null) {
        return callback(new ReturnType(false, "name is missing"));
    }
    Seq().seq(function(){
        var that=this;
        tenantDAO.softDeleteTenant(tenant, function (error, row) {
            if (error) {
                logger.error(' deleteTenant ' + error.message);
                return callback(new ReturnType(false, error.message,name));
            } else {
                if (row.affectedRows > 0){
                    that();
                }else {
                    return callback(new ReturnType(false, null, name));
                }
            }
        });
    }).seq(function(){
        var that=this;
        //soft delete all user of this tenant
        userInfoDAO.softDeleteTenantUser(tenant.name,function(error,rows){
            if (error) {
                return callback(new ReturnType(false, error.message, name));
            }else{
                return callback(new ReturnType(true, null, name));
            }
        })
    })


}

module.exports = {
    addTenants: addTenants,
    updateTenants: updateTenants,
    deleteTenants: deleteTenants,
    getTenants:getTenants
};