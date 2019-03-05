var createError = require('http-errors');
var express = require('express');
var path = require('path');
//设置，获取和删除 cookie
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser'); //body-parser中间件来解析请求体
//在服务端保存数据的中间件，它需要独立安装
var session = require('express-session');
//将session存于mongodb，结合express-session使用
var MongoStore = require('connect-mongo')(session);
var logger = require('morgan');
//读取应用的配置文件
const config = require('config-lite')(__dirname);

var getResponse = require('./utils/commonUtils').getResponse

//引入应用路由
var router = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


//数据库连接
var mongoose = require('mongoose');
mongoose.connect(config.mongodb, { useNewUrlParser: true }, function(error) {
    //这个回调怎么都会执行，但是error可能是null
    // if error is truthy, the initial connection failed.
    if (error) {
        console.log('error');
    }
});
var db = mongoose.connection;
db.on("error", function(error) {
    console.log(error);
    throw error;
});

db.on("open", function(error) {
    if (error) {
        console.log(error);
        throw error;
    }
    console.log("db connect success.");
});


app.use(logger('dev'));
//for parsing application/json
app.use(express.json());
//for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.text());
app.use(cookieParser());
// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
//暴露上传文件夹，使得可访问
app.use("/upload", express.static("upload"));

// session 中间件
app.use(session({
    name: config.session.key, // 设置 cookie 中保存 session id 的字段名称
    secret: config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
    resave: true, // 强制更新 session
    saveUninitialized: false, // 设置为 false，强制创建一个 session，即使用户未登录
    cookie: {
        maxAge: config.session.maxAge // 过期时间，过期后 cookie 中的 session id 自动删除
    },
    store: new MongoStore({ // 将 session 存储到 mongodb
        url: config.mongodb // mongodb 地址
    })
}))


// 没有挂载路径的中间件，应用的每个请求都会执行该中间件
//全局路由中间件，用于设置响应头
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8090'); //先允许跨域请求才能进来
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    res.header('Access-Control-Allow-Headers', 'x-requested-with,content-type');
    next();
});

router(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    //res.render('error');
    return res.json(getResponse(0, err.message));
});

module.exports = app;