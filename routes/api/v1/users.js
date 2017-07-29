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

router.put('/', function (req, res) {
    co(function *() {
        let id = parseInt(req.cookies.user.id);
        if (!util.isValidId(id)) throw new Error('Invalid user ID...');
        let data = req.body;
        if (data.username === undefined || data.username === '') throw new Error('Username is required...');
        if (data.location === undefined || data.location === '') throw new Error('Location is reequired...');
        if (data.weather_api === undefined || data.weather_api === '') throw new Error('Weather API Key is required...');
        let result = (yield userModel.update(id, data));
        req.cookies.user.username = data.username;
        req.cookies.user.location = data.location;
        req.cookies.user.weather_api = data.weather_api;
        res.cookie('user', req.cookies.user);
        res.clearCookie('weather', null);
        util.sendResponse(res, 200, result);
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