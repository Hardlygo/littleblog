/*
 * @Author: pengzy
 * @Date: 2018-07-13 17:50:26
 * @LastEditors: pengzy
 * @LastEditTime: 2018-07-20 10:47:44
 * @Description: 
 */
var express = require('express');

var route = express.Router();

//node文件操作
var fs = require('fs');
//文件操作中间件
var multer = require('multer');

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

var Post = require('../modules/post');
//留言模块，文章与留言是一个整体没有文章必须没有它的留言
var Comment = require('../modules/comment');
//响应生成
var getResponse = require('../utils/commonUtils').getResponse

//为文章增加创建时间
var addCreateAt = require('../utils/commonUtils').addCreateAt

//为文章内容转为mark格式
var content2html = require('../utils/commonUtils').content2html

//
var isEmptyObject = require('../utils/commonUtils').isEmptyObject

//判断是否登录中间件
var isLongin = require('../middleware/check').isLongin;
//文件保存文件夹创建
var uploadPath = './upload/post';
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
        cb(null, 'upload/post/');
    },
    filename: function(req, file, cb) {
        // 将保存文件名设置为 时间戳 + 文件原始名，比如 151342376785-123.jpg
        cb(null, Date.now + '-' + file.originalname);

    }
});

var upload = multer({
    storage: storage
});

var uploadForm = upload.none()
    //发表文章
route.post('/newpost', isLongin, function(req, res) {
    uploadForm(req, res, (error) => {
        if (error) {
            return res.json(getResponse(0, '操作失败', {
                msg: '请不要上传文件'
            }))
        }
        //检测不到文件,往下执行
        let body = req.body;
        let newPost = {
            title: "新的文章",
            //author: body.author, //author的objectId
            author: req.session.user._id,
            content: body.content
        }
        if (!isEmptyObject(newPost) && newPost.author && newPost.content) {
            Post.createPost(newPost, (err, data) => {
                if (err) {
                    return res.json(getResponse(0, '数据保存失败', err))
                }
                let result = data.toObject();
                //增加创建时间项
                addCreateAt(result);
                //内容转为HTML
                // content2html(result);
                return res.json(getResponse(1, '创建成功', result));
            });
        } else {
            return res.json(getResponse(0, '数据保存失败', {
                msg: '参数不全'
            }))
        }
    });
})

//删除文章
route.post('/delete', isLongin, (req, res) => {
    uploadForm(req, res, (error) => {
        if (error) {
            return res.json(getResponse(0, '操作失败', {
                msg: '请不要上传文件'
            }))
        }
        let postId = req.body.id
        let author = req.session.user ? req.session.user._id : undefined
            //权限！本人才能删除自己的文章
        if (postId && author) {
            Post.getPostById(postId, (err1, data1) => {
                if (err1) {
                    return res.json(getResponse(0, '查询失败', {
                        msg: '数据库查询出错'
                    }));
                }
                if (!data1) {
                    return res.json(getResponse(0, '查询失败', {
                        msg: '文章不存在'
                    }));
                }
                let currentPost = data1.toObject()
                if (currentPost.author._id != author) {
                    return res.json(getResponse(0, '操作失败', {
                        msg: '只有本人才能删除'
                    }));
                }
                //删除
                Post.deletePost(postId, (err, data) => {
                    if (err) {
                        return res.json(getResponse(0, '数据操作失败', err));
                    }
                    if (data.ok && data.n > 0) {
                        //删除成功，删除底下留言
                        Comment.deleteCommentByPost(postId, (e, data2) => {
                            if (e) {
                                return res.json(getResponse(0, '数据(留言)操作失败', e));
                            }
                        });
                    }
                    return res.json(getResponse(1, '删除成功', data));
                })
            })

        } else {
            if (!author) {
                return res.json(getResponse(0, '操作失败', {
                    msg: '您还未登录'
                }));
            } else if (!postId) {
                res.json(getResponse(0, '操作失败', {
                    msg: '参数不完整'
                }));
            }
        }
    });
})

//获取一篇文章
route.get('/getpost', (req, res) => {
    let id = req.query.id;
    if (id) {
        Post.getPostById(id, (err, data) => {
            if (err) {
                return res.json(getResponse(0, '查询失败', {
                    msg: '数据库查询出错'
                }));
            }
            if (data) {
                Post.incPv(id, (err2, data2) => {
                    if (err2) {
                        return res.json(getResponse(0, '操作失败', {
                            msg: '浏览量增加出错'
                        }));
                    }
                    let result = data.toObject();
                    delete result.author.password;
                    addCreateAt(result);
                    // content2html(result);
                    res.json(getResponse(1, '获取成功', result));
                });
            } else {
                return res.json(getResponse(0, '查询失败', {
                    msg: '文章不存在'
                }));
            }
        });
    } else {
        res.json(getResponse(0, '查询失败', {
            msg: '查询参数不完整'
        }));
    }
})

//通过用户id或查询所有的文章、
route.get('/getposts', (req, res) => {
    let authorId = req.query ? req.query.id : undefined;
    Post.getPosts(authorId, (err, data) => {
        if (err) {
            return res.json(getResponse(0, '查询失败', {
                msg: '数据库查询出错'
            }));
        }
        let resultList = []
        if (data) {
            for (let item of data) {
                let i = item.toObject()
                delete i.author.password;
                resultList.push(i)
            }
            addCreateAt(resultList);
            // content2html(resultList);
        }
        return res.json(getResponse(1, '获取成功', resultList));
    });


})

module.exports = route;