var commonUtil=require('mp-common-util');
var ESUtil=require('mp-es-util').ESUtil;
var sysError = commonUtil.systemError;
var Seq = require('seq');
var serverLogger = require('../util/ServerLogger.js');
var logger = serverLogger.createLogger('Search.js');
var userInfoDao = require('../dao/UserInfoDAO.js');

var userIndexAliasSuffix="user_pinmudo";
//alernate between these two
var userIndex1Suffix="userindex1_pinmudo";
var userIndex2Suffix="userindex2_pinmudo";
var userIndexType="user";
var defaultPageSize=2000;
var sysConfig = require('../config/SystemConfig.js');

var esUtil=new ESUtil(sysConfig.getElasticSearchOption(),logger);

var userMapping= {
    'user': {
        properties: {
            "tenant": {
                "type": "keyword"
            },
            "name": {
                "type": "keyword"
            },
            "gender": {
                "type": "byte"
            },
            "city": {
                "type": "keyword"
            },
            "state": {
                "type": "keyword"
            },
            "status": {
                "type": "byte"
            },
            "type": {
                "type": "keyword"
            },
            "bizId": {
                "type": "long"
            },
            "bizName": {
                "type": "keyword"
            },
            "att1String": {
                "type": "keyword"
            },
            "createdOn":{
                "type": "date"
            },
            "updatedOn":{
                "type": "date"
            }
        }
    }
};

function doBuildUserIndex(tenant,callback){
    var userIndexAlias=tenant+userIndexAliasSuffix;
    var userIndex1=tenant+userIndex1Suffix;
    var userIndex2=tenant+userIndex2Suffix;

    var indexUser = function(sClient2,index, indexType,start,pageSize,callback){
        userInfoDao.getUser({tenant:tenant,start:start,size:pageSize}, function (error, rows) {
            if(error){
                return callback(error);
            }else {
                var userList = rows;
                if (userList && userList.length > 0) {
                    Seq(userList).seqEach(function (user, i) {
                        var that = this;
                        sClient2.create({
                            index: index,
                            type: indexType,
                            id: user.userId,
                            body: {
                                tenant:user.tenant,
                                name: user.name,
                                gender: user.gender,
                                city: user.city,
                                state: user.state,
                                status: user.status,
                                type: user.type,
                                bizId: user.bizId,
                                bizName: user.bizName,
                                att1String: user.att1String,
                                createdOn: user.createdOn,
                                updatedOn: user.updatedOn
                            }
                        }, function (error, data) {
                            //console.log(data);
                            if (error) {
                                callback(error);
                            } else {
                                that(null, i);
                            }
                        });
                    }).seq(function(){
                        return callback(null,true);
                    })
                } else {
                    return callback(null,false);
                }
            }
        });
    }

    return esUtil.doRotateIndex(userIndexType,userMapping,userIndexAlias,userIndex1,userIndex2, indexUser,defaultPageSize,function(err){
        callback(err);
    })

}


module.exports = {
    doBuildUserIndex:doBuildUserIndex
};