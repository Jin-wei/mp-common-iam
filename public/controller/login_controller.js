
app.controller("loginController",['$rootScope','$scope','$httpService','$filter', function($rootScope, $scope, $httpService,$filter){

  
    //get tenants at login page
    $httpService.get('/tenants').then(function(data){
        if(data.success){
            $scope.tenantList = data.result;
        }else{
            warningBox(data.msg);
        }

    }).catch(function (error) {
        showErrorBox(error,$filter)
    })

    var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
    var tenant = $httpService.getCookie($httpService.TENANT);
    
    var params = {
        'tenant':tenant,
        'token':adminToken
    }
    
    $scope.refreshToken = function(){
        $httpService.post('/auth/refreshedtokens',params).then(function(data){
            if(data.success){
                $httpService.setCookie($httpService.ADMIN_AUTH_NAME ,data.result.accessToken);
                //$httpService.setHeader($httpService.COMMON_AUTH_NAME,data.result.accessToken);
                $httpService.setHeader("auth-token",data.result.accessToken);

                window.location.href="/index.html#/home";
            }else{
                warningBox(data.msg);
            }
        }).catch(function(error){
            showErrorBox(error,$filter)
        });
    }
    if(adminToken){
        $scope.refreshToken();
    }

    $scope.onLogin = function(myTenant){
        if($scope.username == null || $scope.username == ""){
            // warningBox("请输入用户名");
            warningBox($filter('translate')('please_enter_username'));
            return;
        }
        
        if($scope.password == null || $scope.password == ""){
            // warningBox("请输入密码");
            warningBox($filter('translate')('please_enter_password'));
            return;
        }
        
        var params = {
            "userName": $scope.username,
            "password": $scope.password,
            "tenant": myTenant.tenant,
            "method": "usernamepassword"
        }
        
        $httpService.post('/auth/tokens',params).then(function(data){
            console.log('data',data);
            if(data.success){
                $httpService.setCookie($httpService.ADMIN_USERNAME ,data.result.user.userName);
                $httpService.setCookie($httpService.TENANT ,data.result.tenant);
                $httpService.setCookie($httpService.ADMIN_AUTH_NAME, data.result.accessToken);
                $httpService.setHeader($httpService.COMMON_AUTH_NAME,data.result.accessToken);
                $scope.tenant = data.result.tenant;
                tenant=$scope.tenant;
                if(tenant=="0000000000"){
                    window.location.href="/index.html#/tenant_list";
                }else{
                    window.location.href="/index.html#/employeeList";
                }
                
            }else{
                warningBox(data.msg);
            }
            
        }).catch(function (error) {
            ErrorBox($filter('translate')('server_internal_error'));
        })
        
    }
    
}])