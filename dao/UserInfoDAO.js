/**
 * Created by ling xue on 2016/3/2.
 */
var commonUtil = require('mp-common-util');
var encrypt = commonUtil.encrypt;
var db = require('../db/db.js');
var serverLogger = require('../util/ServerLogger.js');
var listOfValue = require('../util/ListOfValue.js');
var logger = serverLogger.createLogger('UserInfoDAO.js');


function createUser(params, callback) {
    var query = 'insert into user_info(tenant,username,email,phone,password,name,gender,avatar,address,state,city,' +
        'zipcode,wechat_id,wechat_status,status,type,biz_id,biz_name,created_by,updated_by,att1_string,att2_string,att3_string,ssn) ' +
        ' values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    paramArr[i++] = params.username;
    paramArr[i++] = params.email;
    paramArr[i++] = params.phone;
    paramArr[i++] = params.password;
    paramArr[i++] = params.name;
    paramArr[i++] = params.gender!=null ? params.gender : 1;
    paramArr[i++] = params.avatar;
    paramArr[i++] = params.address;
    paramArr[i++] = params.state;
    paramArr[i++] = params.city;
    paramArr[i++] = params.zipcode;
    paramArr[i++] = params.wechatId;
    paramArr[i++] = params.wechatStatus!=null?params.wechatStatus:listOfValue.USER_WECHAT_STATUS_NOT_ACTIVE;
    paramArr[i++] = params.status!=null?params.status:listOfValue.USER_STATUS_ACTIVE;
    paramArr[i++] = params.type!=null?params.type:listOfValue.USER_TYPE_USER;
    paramArr[i++] = (params.bizId !=null)?Number(params.bizId):null;
    paramArr[i++] = params.bizName;
    paramArr[i++] = params.createdBy;
    paramArr[i++] = params.updatedBy;
    paramArr[i++] = params.att1String;
    paramArr[i++] = params.att2String;
    paramArr[i++] = params.att3String;
    paramArr[i++] = params.ssn;

    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' createUser ');
        return callback(error, rows);
    })
}

function upsertUser(params, callback) {
    if (params.userId ==null){
        return createUser(params,callback);
    }else{
        var query = " update user_info set username=?,email=?,phone=?,password=?,name = ? ,gender = ?," +
            "address = ? ,state = ? , city = ? ,zipcode = ?,wechat_id=?,wechat_Status=?,status=?,type=?,biz_id=?,biz_name=?," +
            "updated_By=?," +
            "avatar =?, att1_string=?,att2_string=?,att3_string=?,ssn=? where id = ? and tenant=? ";
        var paramsArr = [], i = 0;
        paramsArr[i++] = params.username;
        paramsArr[i++] = params.email;
        paramsArr[i++] = params.phone;
        paramsArr[i++] = params.password;
        paramsArr[i++] = params.name;
        paramsArr[i++] = params.gender;
        paramsArr[i++] = params.address;
        paramsArr[i++] = params.state;
        paramsArr[i++] = params.city;
        paramsArr[i++] = params.zipcode;
        paramsArr[i++] = params.wechatId;
        paramsArr[i++] = params.wechatStatus!=null?params.wechatStatus:listOfValue.USER_WECHAT_STATUS_NOT_ACTIVE;
        paramsArr[i++] = params.status!=null?params.status:listOfValue.USER_STATUS_ACTIVE;
        paramsArr[i++] = params.type!=null?params.type:listOfValue.USER_TYPE_USER;
        paramsArr[i++] = (params.bizId !=null)?Number(params.bizId):null;
        paramsArr[i++] = params.bizName;
        paramsArr[i++] = params.userId;
        paramsArr[i++] = params.avatar;
        paramsArr[i++] = params.att1String;
        paramsArr[i++] = params.att2String;
        paramsArr[i++] = params.att3String;
        paramsArr[i++] = params.ssn;
        paramsArr[i++] = params.userId;
        paramsArr[i++] = params.tenant;
        db.dbQuery(query, paramsArr, function (error, rows) {
            logger.debug(' updateUserInfo ');
            return callback(error, {insertId:params.userId});
        });
    }

    }

function updateUserStatus(params, callback) {
    var query = 'update user_info set status = ? where id=? and tenant=? '
    var paramArr = [], i = 0;
    paramArr[i++] = params.status;
    paramArr[i++] = params.userId;
    paramArr[i++] = params.tenant;
    if (params.bizId !=null){
        query+=" and biz_id=?";
        paramArr[i++] = params.bizId;
    }
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' updateUserStatus ');
        return callback(error, rows);
    })
}

function updateUserWechatStatus(params, callback) {
    var query = 'update user_info set wechat_status = ? where tenant=? '
    var paramArr = [], i = 0;
    paramArr[i++] = params.wechatStatus;
    paramArr[i++] = params.tenant;
    if (params.userId) {
        query = query + " and id = ? ";
        paramArr[i++] = params.userId;
    }
    if (params.wechatId) {
        query = query + " and wechat_id = ? ";
        paramArr[i++] = params.wechatId;
    }
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' updateUserWechatStatus ');
        return callback(error, rows);
    })
}

function getUser(params, callback) {
    var query = 'select tenant,id userId,username userName,email,phone,name,gender,avatar,address,' +
        'state,city,zipcode,wechat_status wechatStatus,status, type,created_on createdOn,' +
        'updated_on updatedOn,biz_id bizId,biz_name bizName,att1_string att1String,' +
        'att2_string att2String,att3_string att3String,ssn ' +
        ' from  user_info where id is not null and deleted_flag=0 and tenant=? ';
    var paramArr = [], i = 0;
    paramArr[i++] = params.tenant;
    if (params.userId != null) {
        query = query + " and id = ? ";
        paramArr[i++] = params.userId;
    }
    if (params.userName != null) {
        query = query + " and username = ? ";
        paramArr[i++] = params.userName;
    }
    if (params.name != null) {
        query = query + " and name like ? ";
        paramArr[i++] = '%'+params.name+'%';
    }
    if (params.ssn != null) {
        query = query + " and ssn = ? ";
        paramArr[i++] = params.ssn;
    }
    if (params.email != null) {
        query = query + " and email = ? ";
        paramArr[i++] = params.email;
    }
    if (params.phone != null) {
        query = query + " and phone = ? ";
        paramArr[i++] = params.phone;
    }
    if (params.wechatId != null) {
        query = query + " and wechat_id = ? ";
        paramArr[i++] = params.wechatId;
    }
    if (params.status != null) {
        query = query + " and status = ? ";
        paramArr[i++] = params.status;
    }
    if (params.bizId) {
        paramArr[i++] = params.bizId;
        query += ' and biz_id = ? ';
    }
    if (params.bizName) {
        paramArr[i++] = '%'+params.bizName+'%';
        query += ' and biz_name like ? ';
    }
    if (params.password) {
        paramArr[i++] = params.password;
        query += ' and password = ? ';
    }
    if (params.att1String) {
        paramArr[i++] = params.att1String;
        query += ' and att1_string = ? ';
    }
    if (params.att2String) {
        paramArr[i++] = params.att2String;
        query += ' and att2_string = ? ';
    }
    if (params.att3String) {
        paramArr[i++] = params.att3String;
        query += ' and att3_string = ? ';
    }
    if (params.type) {
        paramArr[i++] = params.type;
        query += ' and type = ? ';
    }

    if(params.start!=null && params.size !=null){
        paramArr[i++] = Number(params.start);
        paramArr[i++] = Number(params.size);
        query = query + " limit ? , ? ";
    }else{
        query=query + " limit 0,1000";
    }
    db.dbQuery(query, paramArr, function (error, rows) {
        logger.debug(' getUser ');
        return callback(error, rows);
    });
}
function updateUserPassword(params, callback) {
    var query = " update user_info set password= ? where tenant=? ";
    var paramArray = [], i = 0;
    paramArray[i++] = params.password;
    paramArray[i++] = params.tenant;
    if (params.userId) {
        query = query + " and id = ? ";
        paramArray[i++] = params.userId;
    } else if (params.email) {
        query = query + " and email = ? ";
        paramArray[i++] = params.email;
    } else if (params.phone) {
        query = query + " and phone = ? ";
        paramArray[i++] = params.phone;
    }

    db.dbQuery(query, paramArray, function (error, rows) {
        logger.debug(' updateUserPassword ');
        return callback(error, rows);
    });
}
function updateUserPhone(params, callback) {
    var query = " update user_info set phone = ? where tenant=? and id=?";
    var paramArray = [], i = 0;
    paramArray[i++] = params.phone;
    paramArray[i++] = params.tenant;
    paramArray[i++] = params.userId;
    db.dbQuery(query, paramArray, function (error, rows) {
        logger.debug(' updateUserPhone ');
        return callback(error, rows);
    });
}
function updateUserType(params, callback) {
    var query = " update user_info set type = ? where id = ? and tenant=? ";
    var paramsArray = [], i = 0;
    paramsArray[i++] = params.type;
    paramsArray[i++] = params.userId;
    paramsArray[i++] = params.tenant;
    db.dbQuery(query, paramsArray, function (error, rows) {
        logger.debug(' updateUserType ');
        return callback(error, rows);
    });
}
function updateUserInfo(params, callback) {
    var query = " update user_info";
    var paramsArray = [], i = 0;

    var sqlQuery = '';
    if (params.name !=null){
        sqlQuery+=" name = ? ,";
        paramsArray[i++] = params.name;
    }
    if (params.phone !=null){
        sqlQuery+=" phone = ? ,";
        paramsArray[i++] = params.phone;
    }
    if (params.password !=null){
        sqlQuery+=" password = ? ,";
        paramsArray[i++] = encrypt.encryptByMd5(params.password);
    }
    if (params.gender !=null){
        sqlQuery+=" gender = ? ,";
        paramsArray[i++] = params.gender;
    }
    if (params.address !=null){
        sqlQuery+=" address = ? ,";
        paramsArray[i++] = params.address;
    }
    if (params.state !=null){
        sqlQuery+=" state = ? ,";
        paramsArray[i++] = params.state;
    }
    if (params.city !=null){
        sqlQuery+=" city = ? ,";
        paramsArray[i++] = params.city;
    }
    if (params.zipcode !=null){
        sqlQuery+=" zipcode = ? ,";
        paramsArray[i++] = params.zipcode;
    }
    if (params.avatar !=null){
        sqlQuery+=" avatar = ? ,";
        paramsArray[i++] = params.avatar;
    }
    if (params.att1_string !=null){
        sqlQuery+=" att1_string = ? ,";
        paramsArray[i++] = params.att1_string;
    }
    if (params.att2_string !=null){
        sqlQuery+=" att2_string = ? ,";
        paramsArray[i++] = params.att2_string;
    }
    if (params.att3_string !=null){
        sqlQuery+=" att3_string = ? ,";
        paramsArray[i++] = params.att3_string;
    }
    if (params.ssn !=null){
        sqlQuery+=" ssn = ? ,";
        paramsArray[i++] = params.ssn;
    }

    sqlQuery = sqlQuery.substring(0, sqlQuery.length - 1);
    query += ' set ' + sqlQuery;
    query += " WHERE 1 = 1 ";
    if (params.userId !=null){
        query += " and id=?"
        paramsArray[i++] = params.userId;
    }
    if (params.tenant !=null){
        query += " and tenant=?"
        paramsArray[i++] = params.tenant;
    }

    if (params.bizId !=null){
        query += " and biz_id=?"
        paramsArray[i++] = params.bizId;
    }

    console.log('Query: ', query);

    db.dbQuery(query, paramsArray, function (error, rows) {
        logger.debug(' updateUserInfo ');
        return callback(error, rows);
    });
}

function deleteUser(params, callback) {
    var query = " delete from user_info where id = ? and tenant=? ";
    var paramsArray = [], i = 0;
    paramsArray[i++] = Number(params.userId);
    paramsArray[i++] = params.tenant;
    if (params.bizId){
        query += " and biz_id=?"
        paramsArray[i++] = params.bizId;
    }
    db.dbQuery(query, paramsArray, function (error, rows) {
        logger.debug(' deleteUserInfo ');
        return callback(error, rows);
    });
}

function softDeleteTenantUser(tenant, callback) {
    var query = " update user_info set deleted_flag=1 where tenant=? ";
    var paramsArray = [], i = 0;
    paramsArray[i++] = tenant;
    db.dbQuery(query, paramsArray, function (error, rows) {
        logger.debug(' softDeleteTenantUser ');
        return callback(error, rows);
    });
}

function activateUserByEmail(params, callback) {
    var query = " update user_info set status=? where tenant=? and email=? and status<>?";
    var paramsArray = [], i = 0;
    paramsArray[i++] = listOfValue.USER_STATUS_ACTIVE;
    paramsArray[i++] = params.tenant;
    paramsArray[i++] = params.email;
    paramsArray[i++] = listOfValue.USER_STATUS_ACTIVE;

    db.dbQuery(query, paramsArray, function (error, rows) {
        logger.debug(' avtivateUserByEmail');
        return callback(error, rows);
    });
}

module.exports = {
    createUser: createUser,
    upsertUser:upsertUser,
    deleteUser: deleteUser,
    updateUserStatus: updateUserStatus,
    updateUserWechatStatus: updateUserWechatStatus,
    getUser: getUser,
    updateUserPassword: updateUserPassword,
    updateUserPhone: updateUserPhone,
    updateUserType: updateUserType,
    updateUserInfo: updateUserInfo,
    activateUserByEmail:activateUserByEmail,
    softDeleteTenantUser:softDeleteTenantUser
};
