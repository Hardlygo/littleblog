/*
 * @Author: pengzy
 * @Date: 2018-07-10 09:17:01
 * @LastEditors: pengzy
 * @LastEditTime: 2018-07-17 17:52:02
 * @Description: 
 */

//exports the routes of this application
var userRouter=require('./users')
var postRouter=require('./posts')
var commentRouter=require('./comments')
var route=function(app){
  app.use('/user',userRouter)
  app.use('/post',postRouter)
  app.use('/comment',commentRouter)
}

exports = module.exports = route;
