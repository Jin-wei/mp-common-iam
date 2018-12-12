var tokenOptions={
    normalTokenExpireInSeconds:7200,
    refreshedTokenExpireInSeconds:2592000
}


var mysqlConnectOptions ={
    user: 'root',
    password: '123456',
    database:'common_iam',
    host: '127.0.0.1' ,
    charset : 'utf8mb4'
    //,dateStrings : 'DATETIME'
};

var loggerConfig = {
    level : 'DEBUG',
    config : {
        appenders: [
            { type: 'console' },
            {
                "type": "file",
                "filename": "../common-login.log",
                "maxLogSize": 2048000,
                "backups": 10
            }
        ]
    }
}
function getMysqlConnectOptions (){
    return mysqlConnectOptions;
}

var MessageQueueHost = {
    host: "127.0.0.1",
    port:8092
}

var redisConfig = {
    url : "redis://127.0.0.1:6379/",
    keyPrefix: "commonlogin2"
}

var authService={
    url:'http://localhost:8091/api/auth/tokens'
}

var smsOptions = {
    accountSID : "aaf98f894f4fbec2014f6c943d4d135b",
    accountToken : "29ef088c9cc740908f96eec00ba2354c",
    appId : "8aaf070857a243ad0157a6f6ca9b0356",
    captchaTemplateId :  123606,
    inviteUserRegisterTemplateId: 137352,
    inviteUserRegisterLink:"http://localhost:8020/index.html#/register",
    env  : "sandbox",
    enabled:false
}

var systemMailConfig = {
    fromEmail : 'no-reply@missionpublic.com',
    smtp : 'SMTP',
    options : {
        host: "smtp.zoho.com",
        port: 465,
        secureConnection: true,
        auth: {
            user: 'no-reply@missionpublic.com',
            pass: "Mission94539"
        }
    },
    activateUserUrl:"http://localhost:8020/email_active.html#/email_active?activateCode="
}

var indexUserTenants=['jjc','hd'];

var elasticSearchOption ={
    host: '127.0.0.1:9200',
    log: 'trace'
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
