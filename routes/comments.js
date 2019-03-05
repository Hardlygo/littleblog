var express = require('express');
var route = express.Router();
//node文件相关
var fs = require('fs');
var multer = require('multer');

// //数据库连接
// var mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/littleblog', {
//     useNewUrlParser: true
// });
// var db = mongoose.connection
// db.on("error", function(error) {
//     console.log(error);
// });

// db.on("open", function(error) {
//     if (error) {
//         console.log(error);
//     }
//     console.log("connect success.");
// });

var Comment = require('../modules/comment');

//公共处理方法
//生成响应
var getResponse = require('../utils/commonUtils').getResponse
    //增加创建时间项
var addCreateAt = require('../utils/commonUtils').addCreateAt
    //
var content2html = require('../utils/commonUtils').content2html

//判断是否登录中间件
var isLongin = require('../middleware/check').isLongin;

var uploadPath = './upload/comment';
//创建文件夹
var createFileDirectory = function(path) {
    try {
        //判断目录是否存在
        fs.accessSync(path);
    } catch (error) {
        //同步创建目录
        fs.mkdirSync(path);
    }
}

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        //先保证目录已生成
        createFileDirectory(uploadPath);
        cb(null, 'upload/comment/')
    },
    filename: function(req, file, cb) {
        // 将保存文件名设置为 时间戳 + 文件原始名，比如 151342376785-123.jpg
        cb(null, Date.now + '-' + file.originalname);
    }
});

var upload = multer({
    storage: storage
}).none();

//根据文章id获取文章的留言
route.post('/getcomments', (req, res) => {
    upload(req, res, function(error) {
        if (error) {
            return res.json(getResponse(0, '文件上传错误', {
                msg: '暂不支持上传文件'
            }));
        }
        //正常执行
        let postId = req.body.id;
        if (postId) {
            Comment.getComments(postId, (err, data) => {
                if (err) {
                    return res.json(getResponse(0, '数据库错误', {
                        msg: '数据库查询发生错误，请稍后重试'
                    }));
                }
                let resultList = []
                if (data) {
                    for (let item of data) {
                        let i = item.toObject();
                        delete i.author.password;
                        resultList.push(i);
                    }
                    addCreateAt(resultList);
                    content2html(resultList);
                }
                return res.json(getResponse(1, '操作成功', resultList));
            });
        } else {
            return res.json(getResponse(0, '参数不完整', {
                msg: '查询参数不完整'
            }));
        }
    });

});

//新建留言
route.post('/addcomment', function(req, res) {
    upload(req, res, (error) => {
        if (error) {
            res.json(getResponse(0, '文件上传错误', {
                msg: '暂不支持上传文件'
            }));
            return;
        }
        //取得是当前登录的用户的userId
        let userId = req.session.user ? req.session.user._id : undefined
        if (!userId) {
            return res.json(getResponse(0, '操作失败', {
                msg: '您还未登录'
            }));
        }
        if (!req.body.postId || !req.body.content) {
            res.json(getResponse(0, '参数不完整', {
                msg: '参数不完整，请检查'
            }));
            return;
        }
        //正常执行
        let newComment = {
            userId: userId,
            postId: req.body.postId,
            content: req.body.content
        };
        Comment.addComment(newComment, (err, data) => {
            if (err) {
                return res.json(getResponse(0, '数据库错误', {
                    msg: '数据库操作发生错误，请稍后重试'
                }));
            }
            var opt = [{
                path: 'author',
                select: 'name avatar bio',
                model: 'User'
            }];
            //字段填充
            Comment.populate(data, opt, function(e, populatedData) {
                let result = populatedData.toObject();
                addCreateAt(result);
                content2html(result);
                res.json(getResponse(1, '操作成功', result));
            });
        });
    });
})

//根据留言id删除留言(需要是发表留言本人或者post主才能删除)
route.post('/removecomment', isLongin, function(req, res) {
    upload(req, res, (error) => {
        if (error) {
            return res.json(getResponse(0, '文件上传错误', {
                msg: '暂不支持上传文件'
            }));
        }
        if (!req.body.commentId) {
            return res.json(getResponse(0, '参数不完整', {
                msg: '参数不完整，请检查'
            }));
        }
        Comment.getCommentById(req.body.commentId, (e, result) => {
            if (e) {
                throw new Error('数据库操作发生错误，请稍后重试')
            }

            let resultData = result.toObject()
            if (!(resultData.author == req.session.user._id || resultData.post == req.session.user._id)) {
                return res.json(getResponse(0, '操作失败', {
                    msg: '您没有删除的权限'
                }));
            }
            if (!result) {
                return res.json(getResponse(0, '留言数据不存在', {
                    msg: '留言已被删除，请刷新'
                }));
            }
            Comment.deleteCommentById(req.body.commentId, (err, data) => {
                if (err) {
                    return res.json(getResponse(0, '数据库错误', {
                        msg: '数据库操作发生错误，请稍后重试'
                    }));
                }
                res.json(getResponse(1, '操作成功', data));
            })
        });
    });
})

//根据文章id删除
route.post('/removeall', isLongin, (req, res) => {
    upload(req, res, (error) => {
        if (error) {
            return res.json(getResponse(0, '文件上传错误', {
                msg: '暂不支持上传文件'
            }));
        }
        if (!req.body.postId) {
            return res.json(getResponse(0, '参数不完整', {
                msg: '参数不完整，请检查'
            }));
        }
        Comment.deleteCommentByPost(req.body.postId, (err, data) => {
            if (err) {
                return res.json(getResponse(0, '数据库错误', {
                    msg: '数据库操作发生错误，请稍后重试'
                }));
            }
            res.json(getResponse(1, '操作成功', data));
        })
    })
})

//获取留言总数
route.get('/commentcounts', (req, res) => {
    let id = req.query.postId;
    if (id) {
        Comment.getCommentCounts(id, (err, data) => {
            if (err) {
                res.json(getResponse(0, '数据库错误', {
                    msg: '数据库操作发生错误，请稍后重试'
                }));
                return;
            }
            res.json(getResponse(1, '操作成功', data));
        })
    } else {
        res.json(getResponse(0, '参数不完整', {
            msg: '参数不完整，请检查'
        }));
    }
})

module.exports = route