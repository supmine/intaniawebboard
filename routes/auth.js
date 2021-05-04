const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { check, validationResult } = require('express-validator');
const flash = require('connect-flash');
router.post('/register', [
        check('username', 'Please fill your username').notEmpty(),
        check('password', 'Password more than 6').isLength({ min: 6 }),
        check('confirmpassword').custom((value, { req }) => {
            if (value != req.body.password) {
                throw new Error('Password confirmation does not match password')
            }
            return true;
        })
    ], (req, res, next) => {
        const errors = validationResult(req);
        var e = errors.errors;
        var haveError = [];
        for (var key in e) {
            console.log(e[key]);
            haveError.push(
                e[key].msg
            );
        }
        if (!errors.isEmpty()) {
            // console.log(e);
            console.log('error on validate');
            req.flash('error', haveError)
            res.redirect('/register');
        } else {
            next();
        }
    },
    async(req, res) => {
        console.log(req.body);
        //ยังไม่ได้ validate ว่า ช่องที่กรอกแต่ละช่องเป็น email จริงไหม หรือ pass ต้องเกินกี่ตัว
        const { username, password, confirmpassword } = req.body;
        //console.log(username);
        //console.log(password);
        //console.log(comfirmpassword);
        try {
            let haveUsername = await User.findOne({ username });
            if (haveUsername) {
                var error = new Error('User already exist')
                console.log(error);
                req.flash('error', 'User already exist')
                res.redirect('/register');
            }
            const passwordHash = bcrypt.hashSync(password, 10);
            user = new User({
                username,
                password: passwordHash
            });

            await user.save();
            //console.log(user);
            console.log('save to db');
            passport.authenticate('local')(req, res, function() {
                console.log('register and login');
                res.redirect('/topics');
            })
        } catch (error) {
            console.log(error);
            res.redirect('/');
        }
    });
router.post(
    '/login',
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/topics',
        failureFlash: true
    })
);



module.exports = router;