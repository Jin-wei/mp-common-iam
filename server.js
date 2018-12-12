/**
 * Created by ling xue on 2016/3/3.
 */
var restify = require('restify');
var commonUtil = require('mp-common-util');
var authHeaderParser = commonUtil.authHeaderParser;
var userInfo = require('./bl/UserInfo.js');
var userSms = require('./bl/UserMsg.js');
var permission = require('./bl/Permission.js');
var tenantInfo = require('./bl/Tenant.js');
var role = require('./bl/Role.js');
var authCheck = commonUtil.authCheck;
var serverLogger = require('./util/ServerLogger.js');
var listOfValue = require('./util/ListOfValue.js');
var logger = serverLogger.createLogger('server.js');
var sysConfig = require('./config/SystemConfig.js');

function createServer(options) {
    var server = restify.createServer({
        name: 'mp',
        version: '1.0.0'
    });

    // Clean up sloppy paths like
    server.pre(restify.pre.sanitizePath());

    // Handles annoying user agents (curl)
    server.pre(restify.pre.userAgentConnection());

    //server.use(roleBase.checkAuthToken);
    server.use(restify.throttle({
        burst: 100,
        rate: 50,
        ip: true
    }));

    restify.CORS.ALLOW_HEADERS.push('tenant');
    restify.CORS.ALLOW_HEADERS.push('auth-token');
    restify.CORS.ALLOW_HEADERS.push('client-id');
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Origin");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Credentials");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "GET");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "POST");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "PUT");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Methods", "DELETE");
    restify.CORS.ALLOW_HEADERS.push("Access-Control-Allow-Headers", "accept,api-version, content-length, content-md5,x-requested-with,content-type, date, request-id, response-time");
    server.use(restify.CORS());
    server.use(restify.acceptParser(server.acceptable));
    server.use(restify.dateParser());
    server.use(restify.authorizationParser());
    server.use(restify.queryParser());
    server.use(restify.gzipResponse());
    server.use(restify.fullResponse());
    server.use(restify.bodyParser({uploadDir: __dirname + '/uploads/'}));
    server.use(authHeaderParser.authHeaderParser({logger: logger, authUrl: sysConfig.authService.url}));

    var STATIS_FILE_RE = /\.(css|js|jpe?g|png|gif|less|eot|svg|bmp|tiff|ttf|otf|woff|pdf|ico|json|wav|ogg|mp3?|xml)$/i;
    server.get(STATIS_FILE_RE, restify.serveStatic({ directory: './public', default: 'login.html', maxAge: 0 }));

    server.get(/\/apidoc\/?.*/, restify.serveStatic({
        directory: './public'
    }));

    server.get(/\.html$/i,restify.serveStatic({
        directory: './public',
        maxAge: 0
    }));

    server.get('/',restify.serveStatic({
        directory: './public',
        default: 'login.html',
        maxAge: 0
    }));

    server.get('/', function (req, res, next) {
        resUtil.resNoAuthorizedError(null, res, next);
    });

    //tokens
    server.post({path: '/api/auth/tokens', contentType: 'application/json'}, userInfo.userLogin);
    server.post({path: '/api/auth/refreshedtokens', contentType: 'application/json'}, userInfo.refreshToken);
    server.del({path: '/api/auth/tokens', contentType: 'application/json'}, userInfo.userLogOut);


    //invite user to register
    server.post({path: '/api/invitedusers', contentType: 'application/json'}, authCheck.authCheck(),userInfo.inviteUser);
    server.get({path: '/api/invitedusers/phone/:phone', contentType: 'application/json'}, userInfo.getInvitedUserByPhone);

    //USER 模块
    server.post({path: '/api/registeredusers', contentType: 'application/json'}, userInfo.registerUser);
    server.get({path: '/api/users/:userId', contentType: 'application/json'}, authCheck.authCheck(), userInfo.getUserById);
    server.put({path: '/api/users/:userId', contentType: 'application/json'}, authCheck.authCheck(), userInfo.updateUserById);
    server.put({path: '/api/users/:userId/passwords', contentType: 'application/json'}, authCheck.authCheck(), userInfo.modifyUserPswd);
    server.put({path: '/api/users/:userId/phones', contentType: 'application/json'}, authCheck.authCheck(), userInfo.modifyUserPhone);
    server.post({path: '/api/passwords', contentType: 'application/json'}, userInfo.resetUserPswd);

    //admin add user
    server.post({path: '/api/users', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_CREATE_USERS), userInfo.addUsers);
    server.del({path: '/api/users', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_DELETE_USERS),userInfo.deleteUsers);
    server.get({path: '/api/users', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_GET_USERS), userInfo.getUserInfo);
    server.put({path: '/api/users', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_UPDATE_USERS), userInfo.updateUsers);
    server.post({path: '/api/userstatus', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATE_USERS),userInfo.updateUsersStatus);
    server.post({path: '/api/userwechatstatus', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATE_USERS),userInfo.updateUsersWechatStatus);
    server.post({path: '/api/usertypes', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATE_USERS),userInfo.updateUsersType);

    //biz user add user in same biz
    server.post({path: '/api/biz/:bizId/users', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_CREATE_BIZ_USERS), userInfo.addBizUsers);
    server.del({path: '/api/biz/:bizId/users', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_DELETE_BIZ_USERS),userInfo.deleteBizUsers);
    server.get({path: '/api/biz/:bizId/users', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_GET_BIZ_USERS), userInfo.getBizUserInfo);
    server.put({path: '/api/biz/:bizId/users', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_UPDATE_BIZ_USERS), userInfo.updateBizUsers);
    server.post({path: '/api/biz/:bizId/userstatus', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATE_BIZ_USERS),userInfo.updateBizUsersStatus);

    //assign role to biz user
    server.post({path: '/api/biz/:bizId/users/:userId/roles/:roleId', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_ASSIGN_BIZ_USERROLES), role.assignBizUserRole);



    //permissions
    server.post({path: '/api/permissions', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_CREATE_PERMISSIONS), permission.addPermissions);
  //  server.get({path: '/api/permissions', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_GET_PERMISSIONS), permission.getPermissions);

    server.put({path: '/api/permissions', contentType: 'application/json'},  authCheck.authCheck(listOfValue.PERMISSION_UPDATE_PERMISSIONS), permission.updatePermissions);
    server.get({path: '/api/permissions', contentType: 'application/json'}, permission.getPermissions);
    /*server.put({path: '/api/permissions', contentType: 'application/json'},userInfo.registerUser);
     server.get({path: '/api/permissions', contentType: 'application/json'},userInfo.registerWechatUser);*/
     server.del({path: '/api/permissions', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_DELETE_PERMISSIONS),permission.deletePermissions);

    server.get({path: '/api/roles/:roleId/permissions', contentType: 'application/json'}, permission.getRolesPermission);

    //
    //server.get({path: '/api/tenants/:tenant/permissions', contentType: 'application/json'}, permission.getTenantsPermission); //


    //roles
    server.post({path: '/api/roles', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_CREATE_ROLES), role.addRoles);
    server.get({path: '/api/roles', contentType: 'application/json'}, role.getRolesByTenant);
    server.get({path: '/api/user/:userId/roles', contentType: 'application/json'}, role.getUserRoles);

    server.put({path: '/api/roles', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_UPDATE_ROLES), role.putRoles);
    server.del({path: '/api/roles', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_DELETE_ROLES),role.deleteRoles);


    //assign role
    server.post({path: '/api/users/:userId/roles', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_ASSIGN_USERROLES), role.assignUserRole);
    //delete role assign
    server.del({path: '/api/users/:userId/roles/:roleId', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_ASSIGN_USERROLES), role.deleteUserRole);
    server.post({path: '/api/roles/:roleId/permissions', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_ASSIGN_ROLEPERMISSIONS), role.assignRolePermissions);
    server.del({path: '/api/roles/:roleId/permissions', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_ASSIGN_ROLEPERMISSIONS), role.deleteRolePermissions);

    //tenants
    server.post({path: '/api/tenants', contentType: 'application/json'}, authCheck.authCheck(listOfValue.PERMISSION_CREATE_TENANTS), tenantInfo.addTenants);
    server.put({path: '/api/tenants', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_UPDATE_TENANTS),tenantInfo.updateTenants);
    server.del({path: '/api/tenants', contentType: 'application/json'},authCheck.authCheck(listOfValue.PERMISSION_DELETE_TENANTS),tenantInfo.deleteTenants);

    server.get({path: '/api/tenants', contentType: 'application/json'}, tenantInfo.getTenants);

    //usertypes

    //user status

    //消息模块
    //send phone verification code
    server.post({path: '/api/sms/captcha', contentType: 'application/json'}, userSms.sendSmsCaptcha);
    server.post({path: '/api/email/captcha', contentType: 'application/json'}, userSms.sendEmailCaptcha);

    server.get({path: '/api/email/activateUser/:activateCode', contentType: 'application/json'}, userSms.activateUserByEmail);
    server.get('/api/getConnectState',role.getConnectState);

    server.on('NotFound', function (req, res, next) {
        res.send(404);
        next();
    });
    return (server);
}

module.exports = {
    createServer: createServer
};
