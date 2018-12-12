/**
 * Created by liling on 11/29/16.
 */
app.factory('$httpService',['$http','$location','$q','$filter',function($http,$location,$q,$filter){
    var _this = {};
    _this.COMMON_AUTH_NAME ='auth-token';
    _this.USER_ID = "user-id";
    _this.USER_STATUS = "status";
    _this.ADMIN_ID = "admin-id";
    _this.ADMIN_AUTH_NAME = "admin-token";
    _this.ADMIN_STATUS = "admin-status";
    _this.TEMP_TOKEN = 'client-id';
    _this.ADMIN_TYPE = "admin_type";
    _this.ADMIN_PHONE = "phone";
    _this.ADMIN_USERNAME = "username";
    _this.ADMIN_NAME = "name";
    _this.TENANT = "tenant";

    _this.setHeader = function(name,value) {
        $http.defaults.headers.common[name] = value;
    };
    _this.imageServerHost = "http://docs.yipincaidan.com:8093/api"

    _this.setHeader('Content-Type','application/json');

    _this.formPost = function(dom,url,success,error) {

        //url = '/api' + (url[0]==='/'?'':'/') + url;
        var options = {
            url: url,
            type:'post',
            beforeSend: function(xhr) {
                xhr.setRequestHeader(_this.COMMON_AUTH_NAME,$.cookie(_this.ADMIN_AUTH_NAME));
                //xhr.setRequestHeader(_this.TEMP_TOKEN,$.cookie(_this.TEMP_TOKEN));
                //xhr.setRequestHeader('Content-Type','multipart/form-data');
            },
            success: function(data) {
                if($.isFunction(success)) {
                    success(data);
                }
            },
            error: function(data) {
                checkAuthorizedStatus(data);
                if($.isFunction(error)) {
                    error(data);
                }
            }
        };
        $(dom).ajaxSubmit(options);
    };

    var fnArray = ['get','delete','jsonp','head','post','put'];
    for(var i in fnArray) {
        (function(fn) {
            _this[fn] = function(url,param) {
                url = '/api' + (url[0]==='/'?'':'/') + url;
                var deferred = $q.defer();
                //only 'post,put' need 2nd parameter
                $http[fn](url,param).success(function(data){
                    deferred.resolve(data);
                }).error(function(data){
                    checkAuthorizedStatus(data);
                    deferred.reject(data);
                });
                return deferred.promise;
            };
        })(fnArray[i]);
    }

    function checkAuthorizedStatus(data) {
        if(!angular.isUndefined(data.outMsg) && data.outMsg=="Access token error ,the Api can't be accessed") {
            warningBox($filter('translate')('please_relogin'));
            $.cookie(_this.ADMIN_AUTH_NAME,"");
            window.setTimeout(function(){
                window.location.href="login.html";
            },1000);

        }
    }

    _this.setCookie = function (name,value,expire) {
        $.cookie(name, value,{path:'/',expires: expire||30});
    }
    _this.getCookie = function (name) {
        return $.cookie(name);
    }
    _this.removeCookie = function (name){
        $.cookie(name,"");
    }
    _this. getParameter = function(name) {
        //var url = document.location.href;
        var start = url.indexOf("?")+1;
        if (start==0) {
            return "";
        }
        var value = "";
        var queryString = url.substring(start);
        var paraNames = queryString.split("&");
        for (var i=0; i<paraNames.length; i++) {
            if (name==getParameterName(paraNames[i])) {
                value = getParameterValue(paraNames[i])
            }
        }
        return value;
    }

    function getParameterName(str) {
        var start = str.indexOf("=");
        if (start==-1) {
            return str;
        }
        return str.substring(0,start);
    }

    function getParameterValue(str) {
        var start = str.indexOf("=");
        if (start==-1) {
            return "";
        }
        return str.substring(start+1);
    }
    _this.createUUID = function(len,radix){
        var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var chars = CHARS, uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            // Compact form
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
        } else {
            // rfc4122, version 4 form
            var r;

            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';

            // Fill in random data.  At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random()*16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    }
    function createTempToken(){
        var tempToken = _this.getCookie(_this.TEMP_TOKEN);
        if(tempToken == null){
            _this.setCookie(_this.TEMP_TOKEN,_this.createUUID(),1);
        }
    }
    createTempToken();
    _this.setHeader(_this.TEMP_TOKEN,_this.getCookie(_this.TEMP_TOKEN));
    return _this;
}]);