'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let nodemailer = require('nodemailer');
let jade = require('jade');
let config = require('../docs/environments.js');
let util = require('../helper/util.js');
let userModel = require('../models/userModel.js');
let tokenModel = require('../models/tokenModel.js');

let transporter = nodemailer.createTransport({
    service: config.MAIL_PROVIDER,
    auth: {
        user: config.MAIL_SENDER_USER,
        pass: config.MAIL_SENDER_PASSWORD
    }
});

router.get('/', function (req, res) {
    let message = (req.cookies.forgotMessage !== undefined) ? req.cookies.forgotMessage : null;
    res.clearCookie('forgotMessage');
    res.render(
        'forgot_password', {title: config.BLOG_NAME + " | Forgot Password", message: message}
    );
});

router.get('/token', function (req, res) {
    let message = (req.cookies.tokenMessage !== undefined) ? req.cookies.tokenMessage : null;
    let isTokenExpired = (req.cookies.isTokenExpired === "true");
    res.clearCookie('tokenMessage');
    res.clearCookie('isTokenExpired');
    res.render(
        'verify_token', {title: config.BLOG_NAME + " | Verify Token", message: message, isTokenExpired: isTokenExpired}
    );
});

router.get('/token/:token', function (req, res) {
    co(function *() {
        let tokenCode = req.params.token;
        if (tokenCode === undefined || tokenCode === '') throw new Error("Invalid Token...");
        let token = (yield tokenModel.findByToken(tokenCode));
        if (token === null) throw new Error('No token was found...');
        let message = (req.cookies.resetMessage !== undefined) ? req.cookies.resetMessage : null;
        res.clearCookie('resetMessage');
        res.render(
            'password_reset', {title: config.BLOG_NAME + " | Password Reset", token: token, message: message}
        );
    }).catch(function (e) {
        util.renderError(res, e);
        console.log(e);
    });
});

router.get('/success', function (req, res) {
    res.render(
        'success', {title: config.BLOG_NAME + " | Password Reset", text: "You successfully reset Password", redirectURL: "/login", buttonText: "<span class='fa fa-arrow-left'></span> Login"}
    );
});


router.post('/', function (req, res) {
    co(function *() {
        let username = req.body.username;
        let email = req.body.email;
        let regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!regex.test(email)) {
            res.cookie('forgotMessage', "Invalid Email Address");
            res.redirect('/forgotPassword');
            return;
        }
        let user = (yield userModel.findByUsername(username));
        if (user.length === 0) {
            res.cookie('forgotMessage', "No User matches " + username);
            res.redirect('/forgotPassword');
            return;
        }

        let token = {};
        token.token = tokenModel.generateToken(16);
        token.admin_id = user[0].id;
        token.email = email;

        let result = (yield tokenModel.insert(token));

        // Sending email with token
        let url = 'http://' + req.header('host');
        let logo = "cid:logo@masablog.com";
        let text = [
            '<p>Hi ' + username + ',</p>',
            '<p>We received passwrod reset request from you. And now you can reset your password from <a href="' + url + '/forogtPassword/token" target="_blank">Here</a>',
            '<p>Your token is <span style="color:#337ab7;">' + token.token + '</span> </p>'
        ].join('');
        let html = jade.renderFile(__dirname + '/../views/email/template.jade', {logo: logo, URL: url, text: text}, null);
        let options = {
            from: '"' + config.BLOG_NAME + '" <' + config.MAIL_SENDER_USER + '>',
            to: email,
            subject: 'Password Reset verified code',
            html: html,
            attachments: [
                {
                    filename : 'logo-black.png',
                    path: './public/assets/images/logo-black.png',
                    cid : 'logo@masablog.com'
                },
            ],
        };

        transporter.sendMail(options, function (error, info) {
            if (error) {
                res.cookie('forgotMessage', "Email wasn't sent successfully...");
                res.redirect('/forgotPassword');
            } else {
                res.redirect('/forgotPassword/token');
            }
        });
    }).catch(function (e) {
        util.renderError(res, e);
        console.log(e);
    });
});

router.post('/token', function (req, res) {
    co(function *() {
        let token = req.body.token;
        if (token === undefined || token === null || token === '') throw new Error('Invalid Token...');
        let result = (yield tokenModel.isValidToken(token));
        console.log(result.token);
        if (result.error) {
            res.cookie('tokenMessage', result.error);
            if (result.token !== null) res.cookie('isTokenExpired', true);
            res.redirect('/forgotPassword/token');
        } else {
            res.redirect('/forgotPassword/token/' + result.token.token);
        }
    }).catch(function (e) {
        util.renderError(res, e);
        console.log(e);
    });
});

router.post('/token/:token', function (req, res) {
    co(function *() {
        let tokenCode = req.params.token;
        if (tokenCode === undefined || tokenCode === null || tokenCode === '') throw new Error('Invalid Token...');
        let token = (yield tokenModel.findByToken(tokenCode));
        if (token.length < 1) throw new Error('No Token was found...');
        let password = req.body.password;
        let rePassword = req.body.re_password;
        let adminId = parseInt(req.body.id);
        if (!util.isValidId(adminId)) throw new Error('Invalid user ID...');
        if (password !== rePassword) {
            res.cookie('resetMessage', 'Password did not match...');
            res.redirect('/forgotPassword/token/' + tokenCode);
            return;
        }
        if (password === "") {
            res.cookie('resetMessage', 'You need to input password...');
            res.redirect('/forgotPassword/token/' + tokenCode);
            return;
        }
        let hashedPassword = userModel.hashPassword(password);
        let result = (yield userModel.update(adminId, {password: hashedPassword}));
        let deleteResult = (yield tokenModel.delete(token.id));

        res.redirect('/forgotPassword/success');
    }).catch(function (e) {
        util.renderError(res, e);
        console.log(e);
    });
});

module.exports = router;