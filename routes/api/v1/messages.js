'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let gmailHelper = require('../../../helper/gmailHelper.js');

router.get('/', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    gmailHelper.getMessageList(oauth, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.get('/:id', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.params === undefined || req.params.id === undefined) return util.sendResponse(res, 500, "Invalid Mail ID...");
    let id = req.params.id;
    gmailHelper.getMessage(oauth, id, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.delete('/', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.body === undefined || req.body.ids === undefined) return util.sendResponse(res, 500, "Mail IDs are required...");
    let ids = req.body.ids.split(',');
    gmailHelper.trashMessages(oauth, ids, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

function checkToken(req, res, next) {
    let oauth = req.cookies.oauth;
    if (oauth === undefined) return util.sendResponse(res, 500, "Google OAuth is not cached...");
    gmailHelper.checkRefreshToken(oauth, function (error, newOAuth, isUpdated) {
        if (error) return util.sendResponse(res, 500, error.message);
        if (isUpdated) {
            res.cookie('oauth', newOAuth);
        }
        next();
    });
}

module.exports = router;