var mongoose=require('mongoose')
var commentTable={
    post:{//留言所在帖子
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:'Post'
    },
    author:{//留言的人
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    content:{//留言内容
        type:String,
        required:true
    }
}
var commentSchema=mongoose.Schema(commentTable)

var Comment=module.exports=mongoose.model('Comment',commentSchema);

/**
 * @description 发表留言
 * @param {*} com
 * @param {function} cb
 */
module.exports.addComment=function(com,cb){
    
    let newComment={
        author:com.userId,
        post:com.postId,
        content:com.content
    }
    Comment.create(newComment,cb);
}

/**
 * @description 删除留言(根据留言id删除)
 * @param {*} id
 * @param {function} cb
 */
module.exports.deleteCommentById=function(id,cb){
    let query={
        _id:id
    }
    Comment.remove(query,cb)
}

/**
 * @description 删除留言（根据文章id删除）
 * @param {*} id
 * @param {function} cb
 */
module.exports.deleteCommentByPost=function(id,cb){
    
    let query={
        post:id
    }
    Comment.remove(query,cb)
}

/**
 * @description 获得文章下的所有留言(根据文章id),升序输出
 * @param {*} id
 * @param {function} cb
 */
module.exports.getComments=function(id,cb){
    
    let query={
        post:id
    }
    Comment.find(query).populate('author').sort({ _id: 1 }).exec(cb)
}

/**
 * @description 取得留言总数，根据文章id
 * @param {*} id
 * @param {function} cb
 */
module.exports.getCommentCounts=function(id,cb){
    let query={
        post:id
    }
    Comment.countDocuments(query,cb)
}
/**
 * @description 根据留言id取得其具体信息（作者，post，内容）
 * @param {*} id
 * @param {function} cb
 */
module.exports.getCommentById=function(id,cb){
    
    let query={
        _id:id
    }
    Comment.findOne(query).exec(cb);
}

