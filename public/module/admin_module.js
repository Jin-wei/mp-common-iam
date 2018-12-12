/**
 * Created by liling on 11/28/16.
 */

var app = angular.module("admin_module", ['ngRoute', 'datatables','pascalprecht.translate']);

app.config(['$httpProvider','$translateProvider',function($httpProvider,$translateProvider){
    $httpProvider.defaults.headers.common["auth-token"] = $.cookie("admin-token");
    //i18n
    $translateProvider.useStaticFilesLoader({
        prefix: '/i18n/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage(conf.lang);
}]);
