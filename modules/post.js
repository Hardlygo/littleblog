var mongoose = require('mongoose');

var postTable = {
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        /*required:true*/
    },
    content: {
        type: String,
        required: true
    },
    pv: {
        type: Number,
        default: 0
    }
}
var postSchema = mongoose.Schema(postTable)
var Post = module.exports = mongoose.model('Post', postSchema);

//发表文章
module.exports.createPost = function(post, cb) {
    Post.create(post, cb);
}

//查看文章 id为文章id
module.exports.getPostById = function(id, cb) {
    let query = { _id: id }
    Post.findOne(query).populate('author').exec(cb)
}

//查看文章 通过用户id 或者查看全部文章 降序输出
module.exports.getPosts = function(id, cb) {
    let query = {}
    if (id) {
        query.author = id
    }
    Post.find(query).populate('author').sort({ _id: -1 }).exec(cb);
}

//增加文章浏览量
module.exports.incPv = function(id, cb) {
    let query = {
        _id: id
    }
    Post.update(query, { $inc: { pv: 1 } }, cb)
}

//删除文章(文章id)
module.exports.deletePost = function(id, cb) {
    let query = { _id: id }
    Post.remove(query, cb)
}