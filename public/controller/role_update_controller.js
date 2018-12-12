/**
 * Created by liling on 1/13/17.
 */
app.controller("roleUpdateController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter ) {

        $scope.roleArray = passObjService.get();
        $scope.roleDescription = $scope.roleArray.description;
        $scope.rolename = $scope.roleArray.name
        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/role_list';
        }

        //注册
        $scope.updateRole = function (system_flag) {

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

            if($scope.rolename == null || $scope.rolename == ""){
                // warningBox('请输入角色名称!');
                warningBox($filter('translate')('please_enter_role_name'));
            } else if($scope.roleDescription == null || $scope.roleDescription == "") {
                // warningBox('请输入角色描述!');
                warningBox($filter('translate')('please_enter_role_description'));
            } else {
                var params = {
                    "roles": [
                        {
                            "tenant": tenant,
                            "roleId": $scope.roleArray.id,
                            "name": $scope.rolename,
                            "description": $scope.roleDescription
                        }
                    ]
                }
                }
            if(system_flag){
                // warningBox('抱歉，您没有更改角色的权限!');
                warningBox($filter('translate')('sorry_you_have_no_permission_to_change'));
            }else{
                $httpService.put('/roles',params).then(function(data){

                    if(data.success){
                        // warningBox("更改角色信息成功！");
                        warningBox($filter('translate')('update_role_info_success'));
                        window.location.href = 'index.html#/role_list';
                    }else{
                        warningBox(data.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }
            }

        
    }
])
