/**
 * Created by BaiBin on 2017/4/5.
 */
app.controller("tenantUpdateController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter) {
        $scope.tenant = passObjService.get();

        $scope.updateTenant = function(){

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

            if($scope.tenant.tenant == null || $scope.tenant.tenant == ""){
                // warningBox('请输入项目名称!');
                warningBox($filter('translate')('please_enter_project_name'));
            } else if($scope.tenant.description == null || $scope.tenant.description == "") {
                // warningBox('请输入项目描述!');
                warningBox($filter('translate')('please_enter_project_description'));
            } else {
                var params = {
                    "tenants": [
                        {
                            "name": $scope.tenant.tenant,
                            "description": $scope.tenant.description
                        }
                    ]
                }
                $httpService.put('/tenants',params).then(function(data){

                    if(data.success){
                        if(data.result.length > 0){
                            if(data.result[0].success){
                                // InfoBox("更改项目信息成功！");
                                warningBox($filter('translate')('update_project_info_success'));
                                window.location.href = 'index.html#/tenant_list';
                            }else{
                                warningBox(data.result[0].msg);
                            }
                        }else{
                            ErrorBox($filter('translate')('server_internal_error'));
                        }
                    }else{
                        warningBox(data.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }
        }

        $scope.cancel = function(){
            window.location.href = 'index.html#/tenant_list'
        }
    }
]);