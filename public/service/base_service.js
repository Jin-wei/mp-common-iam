
function _BaseBox(boxClass, iconClass, msg, setting){
    setting = setting || {};
    var box = $('<div class="col-xs-12 box-1" style ="">');

    var content='';
    content += '<button type="button" class="close" data-dismiss="alert"><i class="fa fa-remove fa-2x"></i></button>';
    content += '<strong style="position:absolute; margin-top:-2px;"><i class="'+iconClass+'"></i></strong>';
    content += '<span style="display:inline-block; max-width:500px; margin:0px 0px 0px 35px; font-size:18px;">';
    content += msg;
    content += '</span>';
    
    box.html(content);
    $(document).find('body').append(box);
    
    box.addClass(boxClass);
    box.css({position:'fixed','z-index':9999,display:'none', top:'0px'});
    box.fadeIn(500);
    
    var timeout = 3000;
    if(setting.timeout){
        timeout = setting.timeout;
    }
    box.children('.close').click(function(){
        var obj = $(".box-1");
        obj.remove();
        //if(this && this.parentNode) {
        //    box[0].outerHTML = ''
        //}
    });
    
    if(!setting.stick) {
        if(timeout > 0) {
            setTimeout(function () {
                box.fadeOut(1000, function () {
                    if(this.parentNode){
                        this.outerHTML = '';
                    }
                });
            },timeout);
        }
    }
}

function InfoBox(msg,setting) {
    var boxClass = 'alert alert-block alert-info center';
    var iconClass = 'fa fa-bullhorn fa-2x';
    _BaseBox(boxClass,iconClass,msg,setting);
}

function warningBox(msg, setting){
    var boxClass = 'alert alert-block alert-warning center';
    var iconClass = 'fa fa-warning fa-2x';
    setting = setting || {};
    if(!setting.timedOut){
        setting.timeout = 2000;
    }
    _BaseBox(boxClass, iconClass, msg, setting);
}

function ErrorBox(msg,setting) {
    var boxClass = 'alert alert-block alert-danger center';
    var iconClass = 'fa fa-frown-o fa-2x';
    setting = setting || {};
    if(!setting.timeout)
        setting.timeout = 3000;
    _BaseBox(boxClass,iconClass,msg,setting);
}

//object to string
function objToStr(obj){
    var paramStr="";
    if(obj != null){
        var keyStr = Object.keys(obj);
        for(var i=0; i<keyStr.length;i++){
            console.log([keyStr[i]])
            console.log(obj[keyStr[i]])
            if(obj[keyStr[i]] != null && obj[keyStr[i]].length > 0){
                console.log(obj[keyStr[i]])
                paramStr+="&"+keyStr[i]+"="+obj[keyStr[i]];
            }
        }
        paramStr = paramStr.substr(1,paramStr.length);
        paramStr = "?"+paramStr;
    }
    return paramStr;
};

//turn the page
//turnFlag:1:to previous page;2:to next page;3:to specified page;0:to first page;9:to last page
function turnPage (turnFlag,$scope,start,size){
    if(turnFlag==9){
        $scope.specifiedPage = $scope.totalPage;

    }

    var pageFlag = getStart(turnFlag,size,$scope.specifiedPage,$scope.totalPage,start);

    if(pageFlag != -1){
        if(turnFlag==1){
            $scope.currentPage--;
        }else if(turnFlag==2){
            $scope.currentPage++;
        }else if(turnFlag==3){
            $scope.currentPage = $scope.specifiedPage;
        }else if(turnFlag==9){
            $scope.currentPage = $scope.totalPage;
        }

    }
    return pageFlag;

};

function getStart(turnFlag,size,specifiedPage,totalPage,start){
    if(turnFlag==1){
        //to previous page
        start-=size;
        if(start <=0){
            start=0;
        }

        return start;

    }else if(turnFlag==2){
        //to next page
        start+=size;

        return start;

    }else if(turnFlag==3 || turnFlag==9){
        //to specified page
        if(specifiedPage==null || specifiedPage=="" || isNaN(specifiedPage)){
            WarningBox("请输入要跳转的页数!");
            return -1;
        }else if(specifiedPage==0){
            WarningBox("请输入大于0的页数!");
            return -1;
        }else if(specifiedPage - totalPage>0){
            WarningBox("输入的页数不能大于总页数!");
            return -1;
        }else{
            start = size * (specifiedPage-1);

            return start;
        }
    }

};
function showErrorBox(error,$filter){
    if(error.code == "NotAuthorized"){
        // WarningBox("登录已过期，请重新登录!");
        warningBox($filter('translate')('login_has_expired_please_log_in_again'));
    }else{
        // ErrorBox('服务器内部错误');
        ErrorBox($filter('translate')('server_internal_error'));
    }
}