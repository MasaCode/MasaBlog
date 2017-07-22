'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let adminModel = require('../../../models/adminModel.js');

router.put('/resetPassword', function (req, res) {
    co(function *() {
        let id = parseInt(req.cookies.admin.id);
        if (!util.isValidId(id)) throw new Error('Invalid Admin ID...');
        if (req.body === undefined || req.body.currentPassword === undefined || req.body.currentPassword === '' ||
            req.body.newPassword === undefined || req.body.newPassword === '') throw new Error('Passwords are required...');
        let result = (yield adminModel.resetPassword(id, req.body.currentPassword, req.body.newPassword));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

module.exports = router;