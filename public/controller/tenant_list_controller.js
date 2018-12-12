/**
 * Created by liling on 2/17/17.
 */
app.controller("tenantListController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter) {

        var tenant = $httpService.getCookie($httpService.TENANT);
        var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
        $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
        $httpService.setHeader($httpService.TENANT,tenant);
        function getTenant(){
            $httpService.get('/tenants').then(function(data){
                if(data.success){
                    $scope.tenantList = data.result;
                    console.log("tenantlist",$scope.tenantList);
                }else{
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error,$filter)
            })
        }
        getTenant();


        $scope.editTenant = function(t){
            passObjService.set(t);
            window.location.href = 'index.html#/update_tenant';
        }
        $scope.deleteTenant = function(t){
            // var message = '您确定删除' + t.description + '么？'
            var message = $filter('translate')('are_you_sure_you_want_to_delete_the') + ' '+t.description + '?'
            var result = confirm(message);
            if(result){
                var params = {
                    "tenants": [
                        {
                            "name": t.tenant
                        }
                    ]
                }
                $httpService.delete('/tenants',{'data':params}).then(function(data){
                    if(data.success){
                        getTenant();
                        // warningBox("删除成功");
                        warningBox($filter('translate')('delete_project_information_success'));
                    }else{
                        warningBox(data.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }else{

            }
        }

        //添加新用户
        $scope.addTenant = function() {
            window.location.href = 'index.html#/tenant_add';
        }
       
    }
]);
