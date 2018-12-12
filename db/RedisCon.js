/**
 * Created by xueling on 16/4/27.
 */
var Redis = require('ioredis');
var sysConfig = require('../config/SystemConfig.js');
var redis = new Redis(sysConfig.redisConfig.url);


module.exports = redis ;