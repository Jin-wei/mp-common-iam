var assert = require("assert");



exports.test=function(request,token) {
    describe('service: user', function () {
/*        describe('Test create a user', function() {
            it('should create an user', function(done) {
                var user={};
                user.username="jie";
                user.email="jie@hotmail.com";
                user.phone="123456";
                user.password="123456";
                user.name="jie zou";
                user.gender=1;
                *//*user.avatar;
                 user.address;
                 user.state;
                 user.city;
                 user.zipcode;
                 user.wechatId;
                 user.wechatStatus;
                 user.status;*//*

                request.post('/api/user').set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .send(user)
                    .end(function(err,res){
                        if (err) {
                            return done(err);
                        }
                        else {
                            console.dir(res.statusCode);
                            console.dir(res.body);
                            assert(res.body.success==true);
                            done();
                        }
                    });
            });
        });*/
        describe('Test user login', function () {
            it('should get an user token', function (done) {
                var user = {};
                user.username = "jie";
                user.email = "jie@hotmail.com";
                user.phone = "123456";
                user.password = "123456";
                user.name = "jie zou";
                user.gender = 1;
                /*user.avatar;
                 user.address;
                 user.state;
                 user.city;
                 user.zipcode;
                 user.wechatId;
                 user.wechatStatus;
                 user.status;*/

                request.post('/api/login').set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .send(user)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        else {
                            console.dir(res.statusCode);
                            console.dir(res.body);
                            assert(res.body.success == true);
                            done();
                        }
                    });
            });
        });
    });
}
