/**
 * Created by BaiBin on 2017/4/6.
 */
app.controller("employeeAssignRoleController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter) {

        var userId = $location.search().userId;
        $httpService.get('/roles').then(function(data){

            if(data.success){
                $scope.roleList = data.result;
                getRole();
            }else{

            }

        }).catch(function (error) {
            showErrorBox(error)
        })

        function getRole(){
            $httpService.get('/user/'+userId+'/roles').then(function(data){

                if(data.success){
                    for(var i=0;i<data.result.length;i++){
                        $scope.nowRole = data.result[i];
                        var ids = "#" + (data.result[i].roleId).toString()
                        $(ids).prop("checked", "true");
                    }
                }else{

                }
            }).catch(function (error) {
                showErrorBox(error,$filter)
            })
        }

        $("#allSelect").change(function() {
            $("input[name='ccccc']").prop("checked", $("#allSelect").prop("checked"));
        });

        $scope.cancleClick = function(){
            window.location.href = 'index.html#/employeeList'
        }

        $scope.submitClick = function(){

            var roles = []
            $("input[name='ccccc']:checked").each(function(){
                roles.push($(this).val())
            })

            $httpService.post('/users/'+userId+'/roles',{'roles':roles}).then(function(data){
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