app.controller("employeeListController", ['$rootScope','$scope','$httpService','$location','passObjService','$filter',
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


        //get users information
        function getAdminUsers( queryType){
            if(queryType==10){
                start=0;

            }
            var Params = new Object();
            Params.start=String(start);
            Params.size=String(size);
            Params.name=$scope.name;
            Params.username=$scope.userName;
            Params.email=$scope.email;
            Params.phone=$scope.phone;
            Params.bizName=$scope.bizName;
            Params.type=$scope.type;
            Params.att1String=$scope.att1String;
            Params.att2String=$scope.att2String;
            Params.att3String=$scope.att3String;

            var Params = objToStr(Params);

            $httpService.get('/users'+ Params).then(function(data){
                console.log('data',data);
                if(data.success){
                    $scope.tenantList = data.result;
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
                showErrorBox(error)
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

                getAdminUsers(10);

            }else{
                var pageFlag = turnPage(turnFlag,$scope,start,size);
                if(pageFlag!=-1){
                    start = pageFlag;
                    //get table data
                    getAdminUsers();
                }
            }

        };




        //添加新用户
        $scope.addEmployee = function() {
            window.location.href = 'index.html#/employee_add';
        }

        //获取选中用户
        function getSelectedCheckbox(){
            var objs = [];
            $('input:checkbox[name=checkboxId]:checked').each(function(i){
                objs.push($(this).val());
            });
            return objs;
        }

        //删除用户
        $scope.onDeleteUser = function () {
            var users = getSelectedCheckbox();
            if(users.length<=0){

                warningBox($filter('translate')('please_select_the_employee_you_want_to_operate'));
                // warningBox("请先选择要操作的员工");
            }else{
                $('#sure-dialog').modal('show');
            }
        }

        $scope.assginRole = function(user){
            window.location.href = 'index.html#/employee_assign_role?userId='+user.userId;
        }

        $scope.removeEmployee =function (){
           //var tenant = $httpService.getCookie($httpService.TENANT);
           // var adminToken = $httpService.getCookie($httpService.ADMIN_AUTH_NAME);
           // $httpService.setHeader($httpService.ADMIN_AUTH_NAME,adminToken);
           // $httpService.setHeader($httpService.TENANT,tenant);

            var users = getSelectedCheckbox();
            if(users.length<=0){
                warningBox($filter('translate')('please_select_the_employee_you_want_to_operate'));
                // warningBox("请先选择要操作的员工");
                return;
            }


            for(var i in users) {
                var u = JSON.parse(users[i]);
                var params = {
                    "users": [
                        {
                            "userId": u.userId
                        }
                    ]};
                $httpService.delete('/users', {'data':params}).then(function(data){
                    if(data.success){
                        warningBox($filter('translate')('employee_deletion_succeeded'));
                        // warningBox("员工删除成功");
                        getAdminUsers();
                    }else{
                        warningBox(data.msg);
                    }
                }).catch(function (error) {
                    showErrorBox(error)
                });
            }
        };

        getAdminUsers();

        //show user information detail
        $scope.showUserInfo = function(user) {
            passObjService.set(user);
            window.location.href = "index.html#/user_info_detail?userId=" + user.userId;

        }

        $scope.clearClick = function(){
            $scope.name = '';
            $scope.userName = '';
            $scope.email = '';
            $scope.phone = '';
            $scope.bizName = '';
            $scope.type = '';
            $scope.att1String = '';
            $scope.att2String = '';
            $scope.att3String = '';
        }

        $scope.searchClick = function(){
            start = 0;
            size = 15;
            getAdminUsers();
        }

        //set status activity
        $scope.setActiveStatus = function (user) {

            var id = (user.status == 1)? 0 : 1;

            var params = {
                "users": [
                    {
                        "userId": user.userId,
                        "status":id
                    }
                ]
            }
            $httpService.post('/userstatus',params).then(function(data){

                if(data.success){
                    getAdminUsers();
                }else{
                    warningBox(data.msg);
                }

            }).catch(function (error) {
                showErrorBox(error)
            })
        }
        
    }
]);
