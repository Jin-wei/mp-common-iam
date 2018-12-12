/**
 * Created by liling on 1/10/17.
 */
app.controller('roleaddController',['$rootScope','$scope','$httpService','$location','$filter',
    function ($rootScope,$scope,$httpService,$location,$filter) {

        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/role_list';
        }

        //注册
        $scope.addRole = function () {

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

            if($scope.roleName == null || $scope.roleName == ""){
                // warningBox('请输入角色名!');
                warningBox($filter('translate')('please_enter_role_name'));
            }else if($scope.roleDescription == null || $scope.roleDescription == ""){
                // warningBox('请输入角色描述!');
                warningBox($filter('translate')('please_enter_role_description'));
            }else {
                var params = {
                    "roles": [
                        {
                            "name": $scope.roleName,
                            "description": $scope.roleDescription
                        }
                    ]
                }

                $httpService.post('/roles',params).then(function(data){
                    console.log(data);

                    if(data.success){
                        if(data.result[0].success){
                            // warningBox("添加角色信息成功！");
                            warningBox($filter('translate')('added_role_info_success'));
                            window.location.href = 'index.html#/role_list';
                        }else{
                            warningBox(data.result[0].msg);

                        }

                    }else{
                        warningBox(data.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }

        }


}])