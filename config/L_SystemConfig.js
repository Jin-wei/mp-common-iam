var tokenOptions={
    normalTokenExpireInSeconds:@@normalTokenExpireInSeconds,
    refreshedTokenExpireInSeconds:@@refreshedTokenExpireInSeconds
}


var mysqlConnectOptions ={
    user: '@@mysqlUser',
    password: '@@mysqlPass',
    database:'@@mysqlDB',
    host: '@@mysqlHost' ,
    charset : 'utf8mb4'
    //,dateStrings : 'DATETIME'
};

var loggerConfig = {
    level : '@@logLevel',
    config : {
        appenders: [
            { type: 'console' },
            {
                "type": "file",
                "filename": "@@logFileFullName",
                "maxLogSize": @@logMaxSize,
                "backups": @@logBackups
            }
        ]
    }
}
function getMysqlConnectOptions (){
    return mysqlConnectOptions;
}

var MessageQueueHost = {
    host: "@@mqHost",
    port:@@mqPort
}

var redisConfig = {
    url : "@@redisUrl",
    keyPrefix: "@@redisKeyPrefix"
}

var authService={
    url:'@@authServiceUrl'
}

var smsOptions = {
    accountSID : "@@smsAccountSID",
    accountToken : "@@smsAccountToken",
    appId : "@@smsAppId",
    captchaTemplateId :  @@smsCaptchaTemplateId,
    inviteUserRegisterTemplateId: @@smsInviteUserRegisterTemplateId,
    inviteUserRegisterLink:"@@smsInviteUserRegisterLink",
    env  : "@@smsEnv",
    enabled:@@smsEnabled
}

var systemMailConfig = {
    fromEmail : '@@emailFrom',
    smtp : 'SMTP',
    options : {
        host: "@@emailHost",
        port: @@emailPort,
        secureConnection: @@emailSecureConnection,
        auth: {
            user: '@@emailAuthUser',
            pass: "@@emailAuthPass"
        }
    },
    activateUserUrl:"@@emailActivateUserUrl"
}

var indexUserTenants=@@indexUserTenants;

var elasticSearchOption ={
    host: '@@elasticUrl',
    log: '@@elasticLogLevel'
};

function getElasticSearchOption(){
    return elasticSearchOption;
}

module.exports = {
    getMysqlConnectOptions : getMysqlConnectOptions,
    loggerConfig : loggerConfig,
    MessageQueueHost :MessageQueueHost ,
    redisConfig : redisConfig,
    tokenOptions: tokenOptions,
    authService:authService,
    smsOptions:smsOptions,
    systemMailConfig:systemMailConfig,
    indexUserTenants:indexUserTenants,
    getElasticSearchOption:getElasticSearchOption
}
