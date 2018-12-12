/**
 * Created by liling on 1/10/17.
 */
app.controller("permissionUpdateController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter ) {

       $scope.permiArray = passObjService.get();
        $scope.premiDescription = $scope.permiArray.description;
        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/user_permission';
        }

        //注册
        $scope.updatePremission = function (system_flag) {

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

            if($scope.premiDescription == null || $scope.premiDescription == ""){
                warningBox($filter('translate')('please_enter_permission_description'));
            }else {
                var params = {
                    "permissions": [
                        {
                            "permissionId": $scope.permiArray.id,
                            "description": $scope.premiDescription
                        }
                    ]
                }
                if(system_flag){
                    // warningBox('抱歉，您没有更改的权限!');
                    warningBox($filter('translate')('sorry_you_have_no_permission_to_change'));
                }else {

                    $httpService.put('/permissions', params).then(function (data) {

                        if (data.success) {
                            // warningBox("更改权限信息成功！");
                            warningBox($filter('translate')('Change_permissions_success'));
                            window.location.href = 'index.html#/user_permission';
                        } else {
                            warningBox(data.msg);
                        }

                    }).catch(function (error) {
                        showErrorBox(error,$filter)
                    })
                }
            }

        }
    }
])
