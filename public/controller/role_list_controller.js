/**
 * Created by liling on 1/10/17.
 */
app.controller('roleController',['$rootScope','$scope','$httpService','$location','passObjService','$filter'
    ,function($rootScope,$scope,$httpService,$location,passObjService,$filter) {

        var tenant = $httpService.getCookie($httpService.TENANT);
        var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
        $httpService.setHeader($httpService.ADMIN_AUTH_NAME, adminToken);
        $httpService.setHeader($httpService.TENANT, tenant);

        //list number
        var size = 15;
        //list start number
        var start = 0;
        $scope.currentPage = 1;

        //get users information
        function getUserRole(queryType) {
            if (queryType == 10) {
                start = 0;

            }

            var Params = new Object();
            Params.start = start;
            Params.size = size;
            var Params = objToStr(Params);

            $httpService.get('/roles' + Params).then(function (data) {
                console.log('data', data);
                if (data.success) {
                    $scope.roleList = data.result;
                    if (data.result.length < size) {
                        $('#nextBtn').addClass('disabled');
                        $('#nextBtn').attr('disabled', true);
                    } else {
                        $('#nextBtn').removeClass('disabled');
                        $('#nextBtn').attr('disabled', false);
                    }
                } else {
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error, $filter)
            })
        }

        //turn the page
        //turnFlag:1:to previous page; 2:to next page; 0:to first page; 9:to last page
        $scope.turnPage = function (turnFlag) {

            if ((turnFlag == 2) && ($scope.currentPage > 0)) {
                $('#preBtn').removeClass('disabled');
                $('#preBtn').attr('disabled', false);
            }
            ;

            if ((turnFlag == 1) && ($scope.currentPage == 2)) {
                $('#preBtn').addClass('disabled');
                $('#preBtn').attr('disabled', true);
            }
            ;

            if (turnFlag == 0) {

                getUserRole(10);

            } else {
                var pageFlag = turnPage(turnFlag, $scope, start, size);
                if (pageFlag != -1) {
                    start = pageFlag;
                    //get table data
                    getUserRole();
                }
            }

        };


        $scope.adduserRole = function () {
            window.location.href = 'index.html#/role_add';
        }

        $scope.showroleInfo = function (data) {
            passObjService.set(data);
            window.location.href = 'index.html#/role_update';
        }
        $scope.updateRolePermisson = function (role) {
            window.location.href = 'index.html#/update_permission?roleId=' + role.id;
        }

        $scope.deleterRoleInfo = function (data) {
            if (data.system_flag == 1) {
                // ErrorBox('此条信息不能删除');
                ErrorBox($filter('translate')('this_message_cannot_be_deleted'));
            } else {
                var params = {
                    "roles": [
                        data.id
                    ]
                }

                var message = $filter('translate')('are_you_sure_you_want_to_delete_the') +' '+ $filter('translate')('role') + "?";
                var result = confirm(message);
                if (result) {

                    $httpService.delete('/roles', {'data': params}).then(function (data) {
                        console.log(data);

                        if (data.success) {
                            getUserRole();
                            // warningBox("删除角色信息成功");
                            warningBox($filter('translate')('delete_role_information_success'));
                        } else {
                            warningBox(data.msg);
                        }

                    }).catch(function (error) {
                        showErrorBox(error, $filter)
                    })
                }
            }
        }
        getUserRole();
    }
])