var sysConfig = require('../config/SystemConfig.js');
var sendsms=require('send-sms');
//todo: get this by tenant
var yurongyun = new sendsms.adapters.RonglianYun({
    sid: sysConfig.smsOptions.accountSID,
    token: sysConfig.smsOptions.accountToken,
    appId: sysConfig.smsOptions.appId
},sysConfig.smsOptions.env);

exports.sms=new sendsms.SMS('ronglianyun', yurongyun);