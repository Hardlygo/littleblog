/*
 * @Author: pengzy
 * @Date: 2018-07-12 11:19:45
 * @LastEditors: pengzy
 * @LastEditTime: 2018-07-19 09:17:31
 * @Description: 
 */
var express = require('express');
//取得路由实例
var router = express.Router();

//加密
var sha1 = require('sha1');
//node文件操作
var fs = require('fs');
//文件操作中间件
var multer = require('multer');

//文件保存文件夹创建
var uploadPath = './upload/';

//响应生成
var getResponse = require('../utils/commonUtils').getResponse;
//创建文件夹
var createFileDirectory = function(path) {
        try {
            //检测文件夹是否存在，不存在抛出错误
            fs.accessSync(path);
        } catch (error) {
            //创建文件夹
            fs.mkdirSync(path);
        }
    }
    //multer文件的硬盘存储模式
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //先创建路径在保存
        createFileDirectory(uploadPath);
        //指定文件保存路径
        cb(null, 'upload/');
    },
    filename: function(req, file, cb) {
        // 将保存文件名设置为 时间戳 + 文件原始名，比如 151342376785-123.jpg
        cb(null, Date.now() + '-' + file.originalname);

    }
})

var upload = multer({
    storage: storage
});

// //数据库连接
// var mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost:27017/littleblog', {
//     useNewUrlParser: true
// });
// var db = mongoose.connection;
// db.on("error", function(error) {
//     console.log(error);
// });

// db.on("open", function(error) {
//     if (error) {
//         console.log(error);
//     }
//     console.log("connect success.");
// });



var User = require('../modules/user');

//文件上传测试
router.post('/file', upload.single('file'), function(req, res) {
    let avatar = req.file
    console.log(avatar)
    console.log(req.body)
    if (avatar) {
        fs.unlink(avatar.path, (e) => {
            if (e) {
                console.log('文件操作失败')
                throw e;
            } else
                console.log('文件:' + avatar.path + '删除成功！');
        });
    }
    res.status(200).send('上传成功');
})

//用户注册
router.post('/register', upload.single('avatar'), function(req, res) {
    let avatar = req.file;
    let user = req.body;
    //  校验参数
    try {
        if (!avatar || !avatar.path) {
            throw new Error('未选择头像');
        }
        if (!user.name || !(user.name.length >= 1 && user.name.length <= 10)) {
            throw new Error('名字请限制在1到10个字内');
        }
        if (!user.password) {
            throw new Error('请输入密码');
        }
        if (!(user.password == user.password1)) {
            throw new Error('两次密码输入不一次');
        }
        if (['f', 'm', 'x'].indexOf(user.gender) == -1) {
            throw new Error('请选择性别');
        }
        if (!user.bio || !(user.bio.length >= 1 && user.bio.length <= 30)) {
            throw new Error('个人简介请限制在1到30个字内');
        }
    } catch (error) {
        //fs.unlink属于异步操作，要加上回调函数，否则报以下提示
        //[DEP0013] DeprecationWarning: Calling an asynchronous function without callback is deprecated.
        if (avatar && avatar.path) {
            // 注册失败，异步删除上传的头像
            fs.unlink(avatar.path, (e) => {
                if (e) {
                    console.log(e)
                    console.log('文件操作失败')
                    throw e;
                } else
                    console.log('文件:' + avatar.path + '删除成功！');
            });
        }
        return res.json(getResponse(0, error.message));

    }
    // 明文密码加密
    user.password = sha1(user.password)
        //存盘数据
    let newUser = {
        name: user.name,
        password: user.password,
        avatar: avatar.path,
        gender: user.gender,
        bio: user.bio
    };
    //存盘
    User.addUser(newUser, (err, data) => {
        try {
            if (err) {
                throw new Error(err.message)
            }
        } catch (error) {
            if (avatar && avatar.path) {
                // 注册失败，异步删除上传的头像
                fs.unlink(avatar.path, (e) => {
                    if (e) {
                        console.log(e);
                        console.log('文件操作失败')
                        throw e;
                    } else
                        console.log('文件:' + avatar.path + '删除成功！');
                });
            }
            if (error.message.match('duplicate key')) {
                //插入数据库有错，如键值重复
                return res.json(getResponse(0, '用户名重复'))
            }
            return res.json(getResponse(0, error.message))
        }
        //由于mongoose返回的对象实例是经过包装的对象，要删除他的敏感属性要调用toObject的方法转为普通js对象
        //删除敏感信息
        let result = data.toObject();
        delete result.password;
        return res.json(getResponse(1, '注册成功', result))
    });
});

//用户登录
router.post('/login', upload.none(), function(req, res) {
    let user = req.body || {};
    console.log(req.body);
    //判断输入
    try {
        if (!user.name || !user.name.length) {
            throw new Error('用户名为空');
        }
        if (!user.password || !user.password.length) {
            throw new Error('用户密码为空');
        }
    } catch (error) {
        return res.json(getResponse(0, error.message))
    }
    let query = {
            name: user.name
        }
        //数据查询
    User.getUser(query, (err, data) => {
        if (err) {
            return res.json(getResponse(0, '数据库查询出错', err));
        } else {
            if (!data) {
                return res.json(getResponse(0, '用户不存在', data));
            } else if (sha1(user.password) != data.password) {
                return res.json(getResponse(0, '用户名或密码错误'));
            } else {
                let result = data.toObject();
                //登陆成功，保存用户到session
                delete result.password;
                req.session.user = result;

                //res.cookie("user", result, { maxAge: 60000, httpOnly: false });

                return res.json(getResponse(1, '登录成功', result))
            }
        }
    })
});

//获取当前登录用户信息|指定Id用户信息
router.post('/userinfo', upload.none(), (req, res) => {
    let userId = req.body.id;
    console.log(userId)
    if (userId) {
        let query = {
            id: userId
        };
        //数据查询
        User.getUser(query, (err, data) => {
            if (err) {
                return res.json(getResponse(0, '数据库查询出错', err));
            } else {
                if (!data) {
                    return res.json(getResponse(0, '用户不存在', data));
                } else {
                    let result = data.toObject();
                    delete result.password;

                    //res.cookie("user", result, { maxAge: 60000, httpOnly: false });

                    return res.json(getResponse(1, '获取成功', result));
                }
            }
        });
    } else {
        console.log(111)
        if (!req.session.user) {
            res.json(getResponse(0, '失败', {
                msg: '您未登录,获取失败'
            }));
        } else {
            let user = req.session.user;
            console.log(user)
            res.json(getResponse(1, '获取成功', user));
        }
    }
});

//注销登录
router.post('/logout', (req, res) => {
    if (!req.session.user) {
        res.json(getResponse(0, '操作失败', {
            msg: '您未登录，请不要进行此操作'
        }));
    } else {
        let quitUser = req.session.user;
        req.session.user = null; //此操作只能把mongo内session表内的记录的user至null记录过期了才删除
        res.json(getResponse(1, '注销成功', quitUser));
    }
})

module.exports = router;