/*
 * @Author: pengzy
 * @Date: 2018-07-11 10:05:58
 * @LastEditors: pengzy
 * @LastEditTime: 2018-07-19 09:07:55
 * @Description: 用户表model
 */
var mongoose = require('mongoose')

const userTable={
    name:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    avatar:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        enum:['f','m','x'],
        default:'x'
    },
    bio:{
        type:String,
        required:true
    }
}
const userSchema=mongoose.Schema(userTable);

const User =module.exports=mongoose.model('User',userSchema);

//注册增加用户
module.exports.addUser=function(user,cb){
    User.create(user,cb)
}

//更新用户信息
module.exports.updateUser=function(query,update,cb){
    let condition={_id:query.id}
    //以id查询，但是这里的update只能是user的某个或者全部属性不能多（过滤）
    var newUser={}
    for(key in userTable )
    {
        if(update[key])
        {

            newUser[key]=update[key]
        }
    }
    User.updateOne(condition,newUser,cb)
}

//查找用户信息（登录/个人主页）
module.exports.getUser=function(query,cb){
    let condition={}
    if(query.name){
        condition.name=query.name
    }
    else if(query.id){
        condition._id=query.id
    }
    //注意find返回的是数组，findOne返回的是一个对象
    User.findOne(condition,cb);
}

