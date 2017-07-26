'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let userModel = require('../../../models/userModel.js');

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