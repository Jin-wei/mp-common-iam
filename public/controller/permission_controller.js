app.controller("permissionController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
    function($rootScope,$scope,$httpService,$location,passObjService,$filter) {

        var tenant = $httpService.getCookie($httpService.TENANT);
        var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
        $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
        $httpService.setHeader($httpService.TENANT,tenant);

        //list number
        var size = 15;
        //list start number
        var start= 0;
        $scope.currentPage=1;
        

        function getPermission(queryType) {

            if(queryType==10){
                start=0;

            }
            $httpService.get('/permissions?start='+start+'&size='+size).then(function(data){
                console.log('/permissions?start='+start+'&size='+size);
                if(data.success){
                    $scope.permissionsList = data.result;
                    if(data.result.length < size){
                        $('#nextBtn').addClass('disabled');
                        $('#nextBtn').attr('disabled',true);
                    }else{
                        $('#nextBtn').removeClass('disabled');
                        $('#nextBtn').attr('disabled',false);
                    }
                }else{
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error,$filter)
            })
        }

        //turn the page
        //turnFlag:1:to previous page; 2:to next page; 0:to first page; 9:to last page
        $scope.turnPage = function (turnFlag){

            if((turnFlag==2) && ($scope.currentPage > 0)){
                $('#preBtn').removeClass('disabled');
                $('#preBtn').attr('disabled',false);
            };

            if((turnFlag==1) && ($scope.currentPage == 2)){
                $('#preBtn').addClass('disabled');
                $('#preBtn').attr('disabled',true);
            };

            if(turnFlag==0){

                getPermission(10);

            }else{
                var pageFlag = turnPage(turnFlag,$scope,start,size);
                if(pageFlag!=-1){
                    start = pageFlag;
                    //get table data
                    getPermission();
                }
            }

        };
        
        $scope.adduserPermissions = function () {
            window.location.href = 'index.html#/permission_add';
        }
        
        $scope.showPermiInfo = function (permissionObj) {
            passObjService.set(permissionObj);
            window.location.href = 'index.html#/permission_update';
        }

        $scope.deletePermission = function(p){
            // var message = '您确定删除' + p.name + '权限么？'
            var message = $filter('translate')('are_you_sure_you_want_to_delete_the') + ' '+p.name +' '+ $filter('translate')('permission') + "?";
            var result = confirm(message);
            if(result){
                var params = {
                    "permissions": [
                        p.id
                    ]
                }
                $httpService.delete('/permissions',{'data':params}).then(function(data){
                    if(data.success){
                        getPermission();
                        warningBox($filter('translate')('delete_permission_information_success'));
                    }else{
                        warningBox(data.msg);
                    }

                }).catch(function (error) {
                    showErrorBox(error,$filter)
                })
            }else{

            }


        }

        getPermission();
        

    }
]);

