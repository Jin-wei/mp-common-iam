app.controller("configureMenuController", ['$rootScope','$scope','$httpService','$location','$q',
    function($rootScope,$scope,$httpService,$location,$q) {
       // $rootScope.type = $httpService.getCookie($httpService.ADMIN_TYPE);
        $rootScope.username = $httpService.getCookie($httpService.ADMIN_USERNAME);
        window.location.href="index.html#/home";
    }
]);