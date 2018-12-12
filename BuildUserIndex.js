var searchUser=require('./bl/Search.js');
var Seq = require('seq');
var sysConfig = require('./config/SystemConfig.js');
//commond line tool to build product index
(function main() {
    var tenants=sysConfig.indexUserTenants;
    Seq(tenants).seqEach(function(tenant,i){
        var that=this;
        searchUser.doBuildUserIndex(tenants[i], function (error) {
            if (error) {
                console.log(tenants[i]+ "index user failed:" + error.message);
                that(null,i);
            } else {
                console.log(tenants[i] +"index user succeed");
                that(null,i);
            }
        });
    }).seq(function(){
        process.exit(0);
    })
})();