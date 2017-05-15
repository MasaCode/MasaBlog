'use strict';
var express = require('express');
var router = express.Router();
var admin_model = require('../models/admin_model.js');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(function(username, password, done){
    admin_model.findByUsername(username).then(function (admins) {
        if (admins !== null && admins.length !== 0) {
            var length = admins.length;
            for (var i = 0; i < length; i++) {
                if (admin_model.verifyPassword(password, admins[i].password)) {
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
    if (req.cookies.admin) {
        res.redirect('/admin');
    } else {
        var message = req.cookies.loginMessage !== undefined ? req.cookies.loginMessage : null;
        res.render(
            'login', {title: 'MasaBlog | Login', message: message}
        );
    }
});

router.post('/', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) return next(err);
        res.cookie('loginMessage', "Username or Password is not correct.", null);
        if (!user) return res.redirect('/login');
        res.cookie('admin', user, null);
        res.redirect('/admin');
    })(req, res, next);
});

module.exports = router;