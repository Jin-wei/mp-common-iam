app.directive('header', function(){
    return {
        templateUrl:'/view/header.html',
        replace:true,
        transclude:false,
        restrict:'E',
        controller: function ($scope, $httpService, $rootScope) {
            //$rootScope.type = $httpService.getCookie($httpService.ADMIN_TYPE);
            $rootScope.username = $httpService.getCookie($httpService.ADMIN_USERNAME);
            $rootScope.adminTenant = $httpService.getCookie($httpService.TENANT);
            $scope.logOut = function(){
                //删除登录信息
               // $httpService.removeCookie($httpService.ADMIN_AUTH_NAME);
              //  $httpService.removeCookie($httpService.TENANT);

                var tenant = $httpService.getCookie($httpService.TENANT);
                var token = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
               // var params = {
                 //   "tenant": tenant,
                 //   "token": token
               // }

                $httpService.delete('/auth/tokens', {params:{"tenant": tenant, "token": token}}).then(function(data){
                    if(data.success){
                        $httpService.removeCookie($httpService.ADMIN_AUTH_NAME);
                        $httpService.removeCookie($httpService.TENANT);
                        $httpService.removeCookie($httpService.ADMIN_PHONE);
                        $httpService.removeCookie($httpService.ADMIN_USERNAME);
                        $httpService.removeCookie($httpService.ADMIN_NAME);
                        $httpService.removeCookie($httpService.ADMIN_ID);
                        window.location.href='login.html';
                    }else{
                        warningBox(data.msg);
                    }
                }).catch(function (error) {
                    showErrorBox(error)
                });
                
                
            }
        }
    }
    
});

app.directive('tablePage',function(){
    return{
        restrict:'EA',
        templateUrl:'/view/page.html'
    }
});
