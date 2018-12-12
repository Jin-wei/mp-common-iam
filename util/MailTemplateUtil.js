/**
 * Created by ling xue on 14-4-11.
 * The file include the function of create html email template
 */
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var systemConfig = require('../config/SystemConfig.js');
var serverLogger = require('./ServerLogger.js');
var logger = serverLogger.createLogger('MailTemplateUtil.js');
var lov = require('../util/ListOfValue.js')
var handlebars = require("handlebars");


function createActiveUserTemplate(options,callback){
    var filePath = path.join(__dirname, '../templates/activateUser.html');
    fs.readFile(filePath, 'utf8', function (err, data) {
        var template = handlebars.compile(data);
        var emailContent = template(options);
        callback(err,emailContent);
    });

}

function createResetPasswordTemplate(newPassword , callback){
    var emailContent = "";
    fs.readFile('./lib/util/emailTemplate/resetPassword.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createResetPasswordTemplate :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            emailContent = emailContent.toString().replace("$randomPassword$",newPassword);
        }
        callback(err,emailContent);
    });
}

function createBizPasswordTemplate(newPassword , callback){
    var emailContent = "";
    fs.readFile('./lib/util/emailTemplate/resetBizPassword.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createBizPasswordTemplate :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            emailContent = emailContent.toString().replace("$randomPassword$",newPassword);
        }
        callback(err,emailContent);
    });
}

function createActiveBizTemplate(activeCode,email,userId,callback){
    var emailContent = "" ;
    fs.readFile('./lib/util/emailTemplate/activeBizUser.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createActiveBizTemplate :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            emailContent = emailContent.toString().replace("$activeUrl$",systemConfig.getActiveBizBaseUrl(userId)+activeCode);
            emailContent = emailContent.toString().replace("$activeUrl$",systemConfig.getActiveBizBaseUrl(userId)+activeCode);
            emailContent = emailContent.toString().replace("$activeEmail$",email);
            emailContent = emailContent.toString().replace("$websiteUrl$",systemConfig.getServerUrl());
        }
        callback(err,emailContent);
    });

}

//Customer submit order info , the order status is pending
function createSubmitOrderMailTpl(params,callback){
    var emailContent = "" ;
    fs.readFile('./lib/util/emailTemplate/submitOrder.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createSubmitOrderMailTpl :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            //replace parameter
            var userName = "";
            if(params.custInfo.firstName ){
                userName = userName + params.custInfo.firstName ? params.custInfo.firstName : "";
                //userName = userName + params.custInfo.lastName ? params.custInfo.lastName : "";
            }
            var bizUrl = systemConfig.getServerUrl()+"#/restaurant/" + params.bizInfo.bizId;
            var orderTypeStr = params.orderInfo.orderType ==1 ? "Dine in" : " Togo";
            var itemsTableStr = " ";
            if(params.orderItemArray && params.orderItemArray.length>0){
                for(var i=0; i<params.orderItemArray.length; i++){
                    var tdStr = "<tr style='height:50px;'><td>"+params.orderItemArray[i].quantity+"</td>";
                    tdStr = tdStr + "<td>" + params.orderItemArray[i].prodName + ' ' + params.orderItemArray[i].prodNameLang +"</td>";
                    tdStr = tdStr + "<td style='text-align: right;'>"+"$"+params.orderItemArray[i].totalPrice.toFixed(2)+"</td></tr>";
                    itemsTableStr = itemsTableStr + tdStr;
                }
            }



            emailContent = emailContent.toString().replace("$userName$",params.orderInfo.orderUsername);
            emailContent = emailContent.toString().replace("$bizUrl$",bizUrl);
            emailContent = emailContent.toString().replace("$bizUrl$",bizUrl);
            emailContent = emailContent.toString().replace("$bizName$",params.bizInfo.bizName);
            emailContent = emailContent.toString().replace("$bizName$",params.bizInfo.bizName);
            emailContent = emailContent.toString().replace("$orderId$",params.orderInfo.orderId);
            emailContent = emailContent.toString().replace("$bizPhone$",params.orderInfo.orderUserPhone);
            if(params.orderInfo.paymentId == null ){
                emailContent = emailContent.toString().replace("$paymentType$",'Pay In Person ');
            }else{
                if(params.orderInfo.paymentType == lov.PAYMENT_TYPE_PAYPAL){
                    emailContent = emailContent.toString().replace("$paymentType$",'Paypal ');
                }else{
                    emailContent = emailContent.toString().replace("$paymentType$",'Credit Card ');
                }

            }
            //Convert order time by time offset
            var dateOffset = new Date(params.orderInfo.orderStart);
            dateOffset.setMinutes(dateOffset.getMinutes() + params.bizInfo.timeOffset*60);
            emailContent = emailContent.toString().replace("$orderStart$",moment(dateOffset).format("MM/DD/YYYY hh:mm:ss a"));
            emailContent = emailContent.toString().replace("$orderStart$",moment(dateOffset).format("MM/DD/YYYY hh:mm:ss a"));
            emailContent = emailContent.toString().replace("$orderType$",orderTypeStr);
            //Order item in table string
            emailContent = emailContent.toString().replace("$orderItems$",itemsTableStr);
            emailContent = emailContent.toString().replace("$actualPrice$","$"+params.orderInfo.actualPrice.toFixed(2));
            emailContent = emailContent.toString().replace("$totalDiscount$","$"+params.orderInfo.totalDiscount.toFixed(2));
            emailContent = emailContent.toString().replace("$totalTax$","$"+params.orderInfo.totalTax.toFixed(2));
            emailContent = emailContent.toString().replace("$totalPrice$","$"+params.orderInfo.totalPrice.toFixed(2));
            emailContent = emailContent.toString().replace("$servicePhone$",params.bizInfo.phone);
            emailContent = emailContent.toString().replace("$serverUrl$",systemConfig.getServerUrl());
            emailContent = emailContent.toString().replace("$serverUrl$",systemConfig.getServerUrl());

        }
        callback(err,emailContent);
    });
}

function createCancelOrderMailTpl(params,callback){
    var emailContent = "" ;
    fs.readFile('./lib/util/emailTemplate/cancelOrder.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createCancelOrderMailTpl :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            //replace parameter
            var userName = "";
            if(params.custInfo.firstName ){
                userName = userName + params.custInfo.firstName ? params.custInfo.firstName : "";
                //userName = userName + params.custInfo.lastName ? params.custInfo.lastName : "";

            }
            var bizUrl = systemConfig.getServerUrl()+"#/restaurant/" + params.bizInfo.bizId;
            var orderTypeStr = params.orderInfo.orderType ==1 ? "Dine in" : " Togo";
            var itemsTableStr = " ";
            if(params.orderItemArray && params.orderItemArray.length>0){
                for(var i=0; i<params.orderItemArray.length; i++){
                    var tdStr = "<tr><td>"+params.orderItemArray[i].quantity+"</td>";
                    tdStr = tdStr + "<td>"+params.orderItemArray[i].prodName+"</td>";
                    tdStr = tdStr + "<td style='text-align: right;'>"+"$"+params.orderItemArray[i].totalPrice.toFixed(2)+"</td></tr>";
                    itemsTableStr = itemsTableStr + tdStr;
                }
            }



            emailContent = emailContent.toString().replace("$userName$",params.orderInfo.orderUsername);
            emailContent = emailContent.toString().replace("$bizUrl$",bizUrl);
            emailContent = emailContent.toString().replace("$bizUrl$",bizUrl);
            emailContent = emailContent.toString().replace("$bizName$",params.bizInfo.bizName);
            emailContent = emailContent.toString().replace("$bizName$",params.bizInfo.bizName);
            emailContent = emailContent.toString().replace("$orderId$",params.orderInfo.orderId);
            emailContent = emailContent.toString().replace("$bizPhone$",params.orderInfo.orderUserPhone);
            if(params.orderInfo.paymentId == null ){
                emailContent = emailContent.toString().replace("$paymentType$",'Pay In Person ');
            }else{
                if(params.orderInfo.paymentType == lov.PAYMENT_TYPE_PAYPAL){
                    emailContent = emailContent.toString().replace("$paymentType$",'Paypal ');
                }else{
                    emailContent = emailContent.toString().replace("$paymentType$",'Credit Card ');
                }

            }
            //Convert order time by time offset
            var dateOffset = new Date(params.orderInfo.orderStart);
            dateOffset.setMinutes(dateOffset.getMinutes() + params.bizInfo.timeOffset*60);
            emailContent = emailContent.toString().replace("$orderStart$",moment(dateOffset).format("MM/DD/YYYY hh:mm:ss a"));
            emailContent = emailContent.toString().replace("$orderType$",orderTypeStr);

            //Order item in table string
            emailContent = emailContent.toString().replace("$orderItems$",itemsTableStr);
            emailContent = emailContent.toString().replace("$actualPrice$","$"+params.orderInfo.actualPrice.toFixed(2));
            emailContent = emailContent.toString().replace("$totalDiscount$","$"+params.orderInfo.totalDiscount.toFixed(2));
            emailContent = emailContent.toString().replace("$totalTax$","$"+params.orderInfo.totalTax.toFixed(2));
            emailContent = emailContent.toString().replace("$totalPrice$","$"+params.orderInfo.totalPrice.toFixed(2));
            emailContent = emailContent.toString().replace("$servicePhone$",params.bizInfo.phone);
            emailContent = emailContent.toString().replace("$serverUrl$",systemConfig.getServerUrl());
            emailContent = emailContent.toString().replace("$serverUrl$",systemConfig.getServerUrl());
        }
        callback(err,emailContent);
    });
}

function createConfirmOrderMailTpl(params,callback){
    var emailContent = "" ;
    fs.readFile('./lib/util/emailTemplate/confirmOrder.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createConfirmOrderMailTpl :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            //replace parameter
            var userName = "";
            if(params.custInfo.firstName ){
                userName = userName + params.custInfo.firstName ? params.custInfo.firstName +"," : "";
                //userName = userName + params.custInfo.lastName ? params.custInfo.lastName : "";
            }
            var bizUrl = systemConfig.getServerUrl()+"#/restaurant/" + params.bizInfo.bizId;
            var orderTypeStr = params.orderInfo.orderType ==1 ? "Dine in" : " Togo";
            var itemsTableStr = " ";
            if(params.orderItemArray && params.orderItemArray.length>0){
                for(var i=0; i<params.orderItemArray.length; i++){
                    var tdStr = "<tr><td>"+params.orderItemArray[i].quantity+"</td>";
                    tdStr = tdStr + "<td>"+params.orderItemArray[i].prodName+"</td>";
                    tdStr = tdStr + "<td style='text-align: right;'>"+"$"+params.orderItemArray[i].totalPrice.toFixed(2)+"</td></tr>";
                    itemsTableStr = itemsTableStr + tdStr;
                }
            }



            emailContent = emailContent.toString().replace("$userName$",params.orderInfo.orderUsername);
            emailContent = emailContent.toString().replace("$bizUrl$",bizUrl);
            emailContent = emailContent.toString().replace("$bizUrl$",bizUrl);
            emailContent = emailContent.toString().replace("$bizName$",params.bizInfo.bizName);
            emailContent = emailContent.toString().replace("$bizName$",params.bizInfo.bizName);
            emailContent = emailContent.toString().replace("$orderId$",params.orderInfo.orderId);
            emailContent = emailContent.toString().replace("$bizPhone$",params.orderInfo.orderUserPhone);//Convert order time by time offset

            if(params.orderInfo.paymentId == null ){
                emailContent = emailContent.toString().replace("$paymentType$",'Pay In Person ');
            }else{
                if(params.orderInfo.paymentType == lov.PAYMENT_TYPE_PAYPAL){
                    emailContent = emailContent.toString().replace("$paymentType$",'Paypal ');
                }else{
                    emailContent = emailContent.toString().replace("$paymentType$",'Credit Card ');
                }

            }
            var dateOffset = new Date(params.orderInfo.orderStart);
            dateOffset.setMinutes(dateOffset.getMinutes() + params.bizInfo.timeOffset*60);
            emailContent = emailContent.toString().replace("$orderStart$",moment(dateOffset).format("MM/DD/YYYY hh:mm:ss a"));
            emailContent = emailContent.toString().replace("$orderStart$",moment(dateOffset).format("MM/DD/YYYY hh:mm:ss a"));
            emailContent = emailContent.toString().replace("$orderType$",orderTypeStr);
            //Order item in table string
            emailContent = emailContent.toString().replace("$orderItems$",itemsTableStr);
            emailContent = emailContent.toString().replace("$actualPrice$","$"+params.orderInfo.actualPrice.toFixed(2));
            emailContent = emailContent.toString().replace("$totalDiscount$","$"+params.orderInfo.totalDiscount.toFixed(2));
            emailContent = emailContent.toString().replace("$totalTax$","$"+params.orderInfo.totalTax.toFixed(2));
            emailContent = emailContent.toString().replace("$totalPrice$","$"+params.orderInfo.totalPrice.toFixed(2));
            emailContent = emailContent.toString().replace("$servicePhone$",params.bizInfo.phone);
            emailContent = emailContent.toString().replace("$serverUrl$",systemConfig.getServerUrl());
            emailContent = emailContent.toString().replace("$serverUrl$",systemConfig.getServerUrl());
        }
        callback(err,emailContent);
    });
}

function createChangeAccountMailTpl (params,callback){
    var emailContent = "" ;
    fs.readFile('./lib/util/emailTemplate/changeAccount.html', 'utf8', function (err, data) {
        if (err) {
            logger.error(' createChangeAccountMailTpl :'+ err.message);
            throw err;
        }else{
            emailContent = data;
            emailContent = emailContent.toString().replace("$oldEmail$",params.email);
            emailContent = emailContent.toString().replace("$newEmail$",params.newEmail);
            emailContent = emailContent.toString().replace("$websiteUrl$",systemConfig.getServerUrl());

        }
        callback(err,emailContent);
    });
}

module.exports = {
    createActiveUserTemplate :createActiveUserTemplate ,
    createResetPasswordTemplate : createResetPasswordTemplate,
    createBizPasswordTemplate : createBizPasswordTemplate,
    createActiveBizTemplate : createActiveBizTemplate,
    createSubmitOrderMailTpl : createSubmitOrderMailTpl ,
    createCancelOrderMailTpl : createCancelOrderMailTpl,
    createConfirmOrderMailTpl : createConfirmOrderMailTpl,
    createChangeAccountMailTpl : createChangeAccountMailTpl
}
