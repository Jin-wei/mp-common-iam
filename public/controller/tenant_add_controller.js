/**
 * Created by liling on 2/17/17.
 */
app.controller('addTenantController',['$rootScope','$scope','$httpService','$location','$filter',
    function ($rootScope,$scope,$httpService,$location,$filter) {

        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/tenant_list';
        }

        //注册
        $scope.addTenant = function () {

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

            if($scope.name == null || $scope.name == ""){
                // warningBox('请输用户名!');
                warningBox($filter('translate')('please_enter_project_name'));
            }else if($scope.description == null || $scope.description == ""){
                // warningBox('请输入用户描述!');
                warningBox($filter('translate')('please_enter_project_description'));
            }else if($scope.adminUserName == null || $scope.adminUserName == ""){
                // warningBox('请输入管理用户名!');
                warningBox($filter('translate')('please_enter_username'));
            }else if($scope.adminPassword == null || $scope.adminPassword == ""){
                // warningBox('请输入密码!');
                warningBox($filter('translate')('please_enter_password'));
            }else {
                var params = {
                    "tenants": [
                        {
                            "name": $scope.name,
                            "description": $scope.description,
                            "adminUserName": $scope.adminUserName,
                            "adminPassword": $scope.adminPassword
                        }
                    ]
                }

                $httpService.post('/tenants',params).then(function(data){

                    if(data.success){
                        // warningBox("添加项目信息成功！");
                        warningBox($filter('translate')('added_project_information_success'));
                        window.location.href = 'index.html#/tenant_list';
                    }else{
                        warningBox(data.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }

        }


    }])