app.controller("employeeAddController", ['$rootScope','$scope','$httpService','$location','$q','$filter',
    function($rootScope,$scope,$httpService,$location,$q,$filter ) {

        //get role list
        var params = {
            'tenant': $httpService.getCookie($httpService.TENANT)
        }

        $httpService.get('/roles',params).then(function(data){

            if(data.success){
                console.log("get role", data.result);
                $scope.roleList = data.result;
            }else{

            }

        }).catch(function (error) {
            showErrorBox(error,$filter)
        })

        //取消
        $scope.cancel = function () {
            window.location.href = 'index.html#/employeeList';
        }

        //注册
        $scope.onRegister = function (userRole) {

            var tenant = $httpService.getCookie($httpService.TENANT);
            var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
            $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
            $httpService.setHeader($httpService.TENANT,tenant);

           console.log($scope.gender);
            
            if($scope.userName == null || $scope.userName == ""){
                // warningBox('请输入用户名!');
                warningBox($filter('translate')('please_enter_username'));
            }else if($scope.userPhone == null || $scope.userPhone == ""){
                // warningBox('请输入手机号码!');
                warningBox($filter('translate')('please_enter_phone'));
            }else if($scope.gender==null || $scope.gender ==""){
                // warningBox('请输入性别!');
                warningBox($filter('translate')('please_choose_gender'));
            }else if ($scope.againPassword != $scope.password){
                // warningBox('两次输入的密码不一致!');
                warningBox($filter('translate')('the_password_entered_for_the_two_time_is_inconsistent'));
            }
            else {
                var params = {
                    "users":[{
                        "phone": $scope.userPhone,
                        "password": $scope.password,
                        "name": $scope.name,
                        "userName": $scope.userName,
                        "userType": $scope.type,
                        "email":$scope.email,
                        "gender":$scope.gender,
                        "address":$scope.address,
                        "zipcode":$scope.zipcode,
                        "wechatId": $scope.wechatId,
                        "avatar": $scope.avatar,
                        "state": $scope.state,
                        "city": $scope.city,
                        "bizId": $scope.bizId,
                        "bizName": $scope.bizName,
                        "att1String": $scope.att1String,
                        "att2String": $scope.att2String,
                        "att3String": $scope.att3String,
                        "ssn": $scope.ssn
                    }]
                }

                $httpService.post('/users',params).then(function(data){
               //     console.dir(data);
                    if(data.success===true){

                            if(data.result[0].success===true){//
                                // warningBox("添加员工信息成功！");
                                warningBox($filter('translate')('added_employee_information_success'));
                                window.location.href = 'index.html#/employeeList';
                            } else{
                                // warningBox("User info exists already");
                                warningBox($filter('translate')('user_info_exists_already'));
                            }

                    }else{
                        warningBox(date.msg);
                        // warningBox($filter('translate')('user_info_exists_already'));
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }

        }
    }
])
