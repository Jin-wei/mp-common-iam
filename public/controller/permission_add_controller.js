/**
 * Created by liling on 1/9/17.
 */
app.controller("permissionAddController", ['$rootScope','$scope','$httpService','$location','$q','$filter',
    function($rootScope,$scope,$httpService,$location,$q,$filter ) {

        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/user_permission';
        }

        //注册
        $scope.addPremission = function () {

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

            if($scope.premiName == null || $scope.premiName == ""){
                // warningBox('请输入权限名!');
                warningBox($filter('translate')('please_enter_permission_name'));
            }else if($scope.premiDescription == null || $scope.premiDescription == ""){
                // warningBox('请输入权限描述!');
                warningBox($filter('translate')('please_enter_permission_description'));
            }else {
                var params = {
                    "permissions": [
                        {
                            "name": $scope.premiName,
                            "description": $scope.premiDescription
                        }
                    ]
                }

                $httpService.post('/permissions',params).then(function(data){

                    if(data.success){
                        if(data.result[0].success){
                            // warningBox("添加权限信息成功！");
                            warningBox($filter('translate')('add_permissions_information_success'));
                            window.location.href = 'index.html#/user_permission';
                        }else{
                            warningBox(data.result[0].msg);
                        }

                    }else{
                        warningBox(date.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }

        }
    }
])
