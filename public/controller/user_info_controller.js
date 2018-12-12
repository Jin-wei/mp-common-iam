app.controller("userInfoController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter) {

         var userId = $location.search().userId
        $httpService.get('/users?userId='+userId).then(function(data){
            if(data.success){
                if(data.result.length > 0){
                    $scope.user = data.result[0];
                }
            }else{
                warningBox(data.msg);
            }

        }).catch(function (error) {
            showErrorBox(error,$filter)
        })


        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/employeeList';
        }
        //修改用户信息
        $scope.changeInfo = function () {

            if($scope.user.name == null || $scope.user.name.length == 0){
                return;
            }

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);
             console.log("tenant", tenant);
              console.log("admintoken", adminToken);
            var params = {
                "users": [
                    {
                        "userId": $scope.user.userId,
                        "name": $scope.user.name,
                        "gender": $scope.user.gender,
                        "avatar": $scope.user.avatar,
                        "address": $scope.user.address,
                        "state": $scope.user.state,
                        "city": $scope.user.city,
                        "zipcode": $scope.user.zipcode,
                        "att1String": $scope.user.att1String,
                        "att2String": $scope.user.att2String,
                        "att3String": $scope.user.att3String,
                        "ssn": $scope.user.ssn
                    }
                ]
            }

            $httpService.put('/users',params).then(function(data){
                console.log('data',data);
                if(data.success){
                    // InfoBox("更新用户信息成功！");
                    InfoBox($filter('translate')('update_user_info_success'));
                    window.location.href = 'index.html#/employeeList';
                }else{
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error,$filter)
            })
        }
    }
]);
