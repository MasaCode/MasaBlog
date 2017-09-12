'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let config = require('../docs/environments.js');
let userModel = require('../models/userModel.js');

let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done){
    co(function *() {
        let admins = (yield userModel.findByUsername(username));
        if (admins !== null && admins.length !== 0) {
            let length = admins.length;
            for (let i = 0; i < length; i++) {
                if (userModel.verifyPassword(password, admins[i].password)) {
                    return done(null, admins[i]);
                }
            }
            return done(null, false);
        } else {
            return done(null, false);
        }
    }).catch(function (err) {
        return done(err.message);
    });
}));

router.get('/', function (req, res) {
    if (req.cookies.user) {
        res.redirect('/admin');
    } else {
        let message = req.cookies.loginMessage !== undefined ? req.cookies.loginMessage : null;
        res.clearCookie('loginMessage');
        res.render(
            'login', {title: config.BLOG_NAME + " | Login", message: message}
        );
    }
});

router.post('/', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) return next(err);
        res.cookie('loginMessage', "Username or Password is not correct.", null);
        if (!user) return res.redirect('/login');
        delete user.password;
        user.expired = new Date().getTime() + (24 * 60 * 60 * 1000); // Current Time + 1 day
        res.cookie('user', user, null);
        res.clearCookie('loginMessage', null);
        res.redirect('/admin');
    })(req, res, next);
});

module.exports = router;