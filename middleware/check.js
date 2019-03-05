var getResponse=require('../utils/commonUtils').getResponse;
module.exports={
    isLongin:function isLongin (req,res,next){
        if(!req.session.user){
            return res.json(getResponse(0,'未允许的操作',{msg:'您还未登录，请先登录'}))
        }
        else{
            next();
        }
    }
}