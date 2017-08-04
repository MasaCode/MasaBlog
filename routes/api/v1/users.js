'use strict';
let express = require('express');
let router = express.Router();
let fs = require('fs');
let co = require('co');
let multer = require('multer');
let util = require('../../../helper/util.js');
let userModel = require('../../../models/userModel.js');
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/assets/profile');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
let upload = multer({storage: storage}).single('photo');
let CREDENTIAL_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid User ID...');
        let user = (yield userModel.findById(id));
        delete user.password;
        if (user.gmail_credentials !== 'null' && user.gmail_credentials !== '') {
            fs.readFile(CREDENTIAL_DIR + user.gmail_credentials, function (error, context) {
                if (error) util.sendResponse(res, 500, error.message);
                else util.sendResponse(res, 200, {user: user, credentials: JSON.parse(context)});
            });
        } else {
            util.sendResponse(res, 200, {user: user, credentials: null});
        }
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.put('/', function (req, res) {
    co(function *() {
        let id = parseInt(req.cookies.user.id);
        if (!util.isValidId(id)) throw new Error('Invalid user ID...');
        let data = req.body;
        let credentials = util.clone(data.credentials);
        let isCredentialsUpdated = (data.isCredentialsUpdated === 'true');
        if (data.username === undefined || data.username === '') throw new Error('Username is required...');
        if (data.location === undefined || data.location === '') throw new Error('Location is reequired...');
        if (data.weather_api === undefined || data.weather_api === '') throw new Error('Weather API Key is required...');
        if (credentials !== null  && credentials !== '' && (req.cookies.user.gmail_credentials === '' || req.cookies.user.gmail_credentials === null)) {
            data.gmail_credentials = util.generateRandomString(16) + '.json';
            data.gmail_tokens = util.generateRandomString(16) + '_token.json';
            req.cookies.user.gmail_credentials = data.gmail_credentials;
            req.cookies.user.gmail_tokens = data.gmail_tokens;
        } else if ((credentials === null || credentials === '')  && (req.cookies.user.gmail_credentials !== '' && req.cookies.user.gmail_credentials !== null)) {
            let credential_path = CREDENTIAL_DIR + req.cookies.user.gmail_credentials;
            let token_path = CREDENTIAL_DIR + req.cookies.user.gmail_tokens;
            data.gmail_credentials = '';
            data.gmail_tokens = '';
            fs.unlinkSync(credential_path);
            fs.unlinkSync(token_path);
            req.cookies.user.gmail_credentials = '';
            req.cookies.user.gmail_tokens = '';
        } else if (isCredentialsUpdated && credentials !== null  && credentials !== '' && req.cookies.user.gmail_credentials !== '' && req.cookies.user.gmail_credentials !== null) {
            let token_path = CREDENTIAL_DIR + req.cookies.user.gmail_tokens;
            fs.unlinkSync(token_path);
        }
        req.cookies.user.username = data.username;
        req.cookies.user.location = data.location;
        req.cookies.user.weather_api = data.weather_api;
        res.clearCookie('weather', null);
        res.clearCookie('oauth');

        if (credentials !== null && credentials !== '' && isCredentialsUpdated) {
            fs.writeFile(CREDENTIAL_DIR + req.cookies.user.gmail_credentials, credentials, function (error, context) {
                co(function *() {
                    if (error) throw new Error(error);
                    else {
                        delete data.credentials;
                        delete data.isCredentialsUpdated;
                        let result = (yield userModel.update(id, data));
                        res.cookie('user', req.cookies.user);
                        console.log("Credential Information stored at " + CREDENTIAL_DIR + req.cookies.user.gmail_credentials);
                        util.sendResponse(res, 200, result);
                    }
                }).catch(function (e) {
                    util.sendResponse(res, 500, error);
                    console.log(e);
                });
            });
        } else {
            delete data.credentials;
            delete data.isCredentialsUpdated;
            let result = (yield userModel.update(id, data));
            res.cookie('user', req.cookies.user);
            util.sendResponse(res, 200, result);
        }
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.put('/profile', function (req, res) {
    upload(req, res, function (error) {
        co(function *() {
            let id = parseInt(req.cookies.user.id);
            if (!util.isValidId(id)) throw new Error('Invalid user ID...');
            if (error) throw new Error(error.message);
            let imagePath = util.getImagePath(req.file);
            if (imagePath === null) throw new Error('Profile Photo is required...');
            let result = (yield userModel.update(id, {image_path: imagePath}));
            if (req.cookies.user.image_path !== null) {
                fs.unlink('public/assets/profile/' + req.cookies.user.image_path);
            }
            req.cookies.user.image_path = imagePath;
            res.cookie('user', req.cookies.user);
            util.sendResponse(res, 200, result);
        }).catch(function (e) {
            util.sendResponse(res, 500, e.message);
            console.log(e);
        });
    });
});

router.put('/resetPassword', util.allowAction, function (req, res) {
    co(function *() {
        let id = parseInt(req.cookies.user.id);
        if (!util.isValidId(id)) throw new Error('Invalid User ID...');
        if (req.body === undefined || req.body.currentPassword === undefined || req.body.currentPassword === '' ||
            req.body.newPassword === undefined || req.body.newPassword === '') throw new Error('Passwords are required...');
        let result = (yield userModel.resetPassword(id, req.body.currentPassword, req.body.newPassword));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

module.exports = router;