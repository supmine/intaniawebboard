//import lib
const express = require('express');
const initServer = require('./configs/database');
const User = require('./models/user');
const bcrypt = require('bcryptjs');
const passport = require('passport');
var path = require('path');
var cookieParser = require('cookie-parser');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const multer = require('multer');
require('dotenv/config');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

var flash = require('connect-flash');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
});
// import routers
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const topicRouter = require('./routes/topic');
const commentRouter = require('./routes/comment');

// ใช้ LocalStrategy โดยใช้ username และ password
// ภายใน function จะใช้ User.findOne() เพื่อหา username ใน Database
// ถ้าเจอ ก็ compareSync ด้วย bcrypt หากตรง แสดงว่า login ถูกต้อง
// ก็จะ cb (คือ callback function) ส่งต่อไปให้ `req.user` จะมีค่า user
// และไป step ถัดไปคือ serialzie และ deserialize
passport.use(
    new LocalStrategy((username, password, done) => {
        User.findOne({ username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                console.log('incorrect username');
                return done(null, false, { message: 'Incorrect username' });
            }

            if (bcrypt.compareSync(password, user.password)) {
                console.log(user.username + ' is login');
                return done(null, user);
            }
            console.log('incorrect password');
            return done(null, false, { message: 'Incorrect password.' });
        });
    })
);
// serializeUser และ seserialize จะใช้ร่วมกับ session เพื่อจะดึงค่า user ระหว่าง http request
// โดย serializeUser จะเก็บ ค่าไว้ที่ session
// ในที่นี้คือ cb(null, user._id_) - ค่า _id จะถูกเก็บใน session
// ส่วน derialize ใช้กรณีที่จะดึงค่าจาก session มาหาใน DB ว่าใช่ user จริงๆมั้ย
// โดยจะเห็นได้ว่า ต้องเอา username มา `User.findById()` ถ้าเจอ ก็ cb(null, user)
passport.serializeUser((user, cb) => {
    cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
    User.findById(id, (err, user) => {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});



//initServer();
//connect db + start server
const PORT = process.env.PORT || 4000;
initServer().then(result => {
    app.listen(process.env.PORT || 4000, (req, res) => {
        console.log(`Server Started at PORT ${process.env.PORT || 4000}`);
    });
});



var app = express();

//set viewengine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: 'my_super_secret',
        resave: false,
        saveUninitialized: false
    })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// handing CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/topics', topicRouter);
app.use('/comment', commentRouter);

// TEST FILE UPLOAD TO S3 //
const upload = require('./util/uploadImage');
//in <input name="vvvvvvvv">       
app.post('/upload', upload.single('imageUrl'), async(req, res) => {
    const fileType = path.extname(req.file.originalname);
    const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${uuidv4()}.${fileType}`,
            Body: req.file.buffer,
            ACL: "public-read"
        }
        //console.log(req.protocol + '://' + req.get('host') + req.originalUrl);
        //res.status(200).send('asd');
    var url = null;
    await s3.upload(params).promise()
        .then(data => {
            url = data.Location;
            console.log(url);
        })
        .catch(err => {
            console.log(err)
            res.status(500).json({
                error: err
            });
        });
    console.log('here');
});

app.get('/addtopic', (req, res) => {
        res.render('addtopic', { message: "" });
    })
    // END TEST FILE UPLOAD TO S3 //

const Topic = require('./models/topic');
const Comment = require('./models/comment');
const Test = require('./models/test');
const mongoose = require('mongoose');
app.get('/test', async(req, res) => {
    const result = await Topic.findById('608be494fd737b2d7029e8a1');
    res.json(result);
});


//handling errors
app.use((req, res, next) => {
    const err = new Error('Not found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.json({
        error: {
            message: err.message,
        }
    });
});
// const PORT = process.env.PORT || 4000
// app.listen(PORT, (req, res) => {
//     console.log(`Server Started at PORT ${PORT}`);
// });