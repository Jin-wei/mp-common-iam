//date format yyyy-mm-dd hh:mm
app.filter('dateFormat',function(){
    return function(date) {
        if(date == null || date==""){
            return null;
        }else {
            var d = new Date(date);
            var utc8 = d.getTime();
            var newTime = new Date(utc8);
            var Year = newTime.getFullYear();
            var Month = newTime.getMonth()+1;
            var myDate = newTime.getDate();
            var hour = newTime.getHours();
            var minute = newTime.getMinutes();
            if(minute<10){
                minute="0"+minute;
            }
            if(hour<10){
                hour="0"+hour;
            }
            if(myDate<10){
                myDate="0"+myDate;
            }
            if(Month<10){
                Month="0"+Month;
            }
            var allTime = hour+":"+minute;

            var time = Year+"-"+Month+"-"+myDate+" "+allTime;
            return time;
        }
    };
});
app.filter('user_type',function(){
    return function(type) {
        if(type=='user'){
            return "user"
        }else if(type=='internal'){
            return "admin_manager"
        }else if(type=='system'){
            return "system_manager"
        }else if(type=='supplier'){
            return "supplier"
        }else{
            return ""
        }
    };
});
