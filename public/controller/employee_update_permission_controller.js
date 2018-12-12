/**
 * Created by BaiBin on 2017/3/27.
 */
app.controller("updatePermissionController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter) {
        var tenant = $httpService.getCookie($httpService.TENANT);
        var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
        $httpService.setHeader($httpService.ADMIN_AUTH_NAME, adminToken);
        $httpService.setHeader($httpService.TENANT, tenant);

        var roleId = $location.search().roleId;
        $httpService.get('/permissions').then(function(data){
            console.log('data',data);
            if(data.success){
                $scope.permissionsList = data.result;
                getPerssionsByRoleId();
            }else{
                warningBox(data.msg);
            }

        }).catch(function (error) {
            showErrorBox(error,$filter)
        })

        function getPerssionsByRoleId(){
            $httpService.get('/roles/' + roleId + '/permissions').then(function(data){
                if(data.success){
                    for(var i =0;i<data.result.length;i++){
                        var ids = "#" + (data.result[i].id).toString()
                        $(ids).prop("checked", "true");
                    }
                }else{
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error,$filter)
            })
        }

        $("#allSelect").change(function() {
            $("input[name='ccccc']").prop("checked", $("#allSelect").prop("checked"));
        });

        $scope.cancleClick = function(){
            window.location.href = 'index.html#/role_list'
        }

        $scope.submitClick = function(){

            var permissions = []
            $("input[name='ccccc']:checked").each(function(i){
                permissions.push($(this).val())
            })

            $httpService.post('/roles/'+roleId+'/permissions',{'permissions':permissions}).then(function(data){
                if(data.success){
                    // InfoBox('更改权限成功!')
                    InfoBox($filter('translate')('Change_permissions_success'));
                }else{
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error,$filter)
            })
        }
    }
]);