'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let multer = require('multer');
let util = require('../../../helper/util.js');
let googleHelper = require('../../../helper/googleHelper.js');

router.use(multer({limits: { fieldSize: 5 * 1024 * 1024 }}).array());

router.get('/', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    googleHelper.getMessageList(oauth, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.get('/search', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.query === undefined || req.query.label === undefined || req.query.label === '') return util.sendResponse(res, 500, "Invalid Search query...");
    let query = req.query.label;
    googleHelper.searchMailBox(oauth, query, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.get('/attachments/:id', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    let id = parseInt(req.params.id);
    if (!util.isValidId(id)) return util.sendResponse(res, 500, "Invalid Mail ID...");
    if (req.query === undefined || req.query.attachmentIds === undefined) return util.sendResponse(res, 500, "Attachments IDs are required...");
    let attachmentIds = req.query.attachmentIds.split(',');
    googleHelper.getAttachments(oauth, id, attachmentIds, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.get('/:id', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.params === undefined || req.params.id === undefined || req.params.id === '') return util.sendResponse(res, 500, "Invalid Mail ID...");
    let id = req.params.id;
    googleHelper.getMessage(oauth, id, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.put('/markAsRead/:id', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.params === undefined || req.params.id === undefined || req.params.id === '') return util.sendResponse(res, 500, "Invalid Mail ID....");
    let id = req.params.id;
    googleHelper.modifyMessageLabel(oauth, id, [], ['UNREAD'], function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.put('/untrash', function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.body === undefined || req.body.ids === undefined) return util.sendResponse(res, 500, "Mail IDs are required...");
    let ids = req.body.ids.split(',');
    googleHelper.untrashMessages(oauth, ids, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

router.post('/', checkToken, function (req, res) {
    co(function *() {
        let oauth = req.cookies.oauth;
        let data = req.body;
        if (data.to === undefined || data.to === '') throw new Error('Email receiver is required...');
        if (data.subject === undefined) throw new Error('Email subject is required...');
        if (data.body === undefined) throw new Error('Email body is required...');
        let profile = (yield googleHelper.getProfile(oauth));
        if (data.hasAttachment !== 'true') {
            googleHelper.sendMessage(oauth, {
                'Content-Type': 'text/plain',
                'to': data.to,
                'from': profile.name + ' <' + profile.email + '>',
                'subject': data.subject,
            }, data.body, function (error, response) {
                if (error) util.sendResponse(res, 500, error.message);
                else util.sendResponse(res, 200, response);
            });
        } else {
            // Send Gmail With Attachments
            let attachments = JSON.parse(req.body.attachments);
            if (attachments.length === 0) throw new Error('No attachment is selected...');
            googleHelper.sendMessageWithAttachment(oauth, {
                'Content-Type': 'text/plain',
                'to': data.to,
                'from': profile.name + ' <' + profile.email + '>',
                'subject': data.subject,
            }, data.body, data.boundary, attachments, function (error, response) {
                if (error) util.sendResponse(res, 500, error.message);
                else util.sendResponse(res, 200, response);
            });
        }
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/reply', checkToken, function (req, res) {
    co(function *() {
        let oauth = req.cookies.oauth;
        let data = req.body;
        if (data.to === undefined || data.to === '') throw new Error('Email receiver is required...');
        if (data.inReplyTo === undefined || data.inReplyTo === '') throw new Error('Email id is required...');
        if (data.subject === undefined) throw new Error('Email subject is required...');
        if (data.body === undefined) throw new Error('Email body is required...');
        let profile = (yield googleHelper.getProfile(oauth));
        if (data.hasAttachment !== 'true') {
            googleHelper.sendMessage(oauth, {
                'Content-Type': 'text/plain',
                'to': data.to,
                'In-Reply-To': data.inReplyTo,
                'from': profile.name + ' <' + profile.email + '>',
                'subject': data.subject,
            }, data.body, function (error, response) {
                if (error) util.sendResponse(res, 500, error.message);
                else util.sendResponse(res, 200, response);
            });
        } else {
            // Send Gmail With Attachments
            let attachments = JSON.parse(req.body.attachments);
            if (attachments.length === 0) throw new Error('No attachment is selected...');
            googleHelper.sendMessageWithAttachment(oauth, {
                'Content-Type': 'text/plain',
                'to': data.to,
                'In-Reply-To': data.inReplyTo,
                'from': profile.name + ' <' + profile.email + '>',
                'subject': data.subject,
            }, data.body, data.boundary, attachments, function (error, response) {
                if (error) util.sendResponse(res, 500, error.message);
                else util.sendResponse(res, 200, response);
            });
        }
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    })
});

router.delete('/', checkToken, function (req, res) {
    let oauth = req.cookies.oauth;
    if (req.body === undefined || req.body.ids === undefined) return util.sendResponse(res, 500, "Mail IDs are required...");
    let ids = req.body.ids.split(',');
    googleHelper.trashMessages(oauth, ids, function (error, response) {
        if (error) util.sendResponse(res, 500, error.message);
        else util.sendResponse(res, 200, response);
    });
});

function checkToken(req, res, next) {
    let oauth = req.cookies.oauth;
    if (oauth === undefined) return util.sendResponse(res, 500, "Google OAuth is not cached...");
    googleHelper.checkRefreshToken(oauth, req.cookies.user.gmail_tokens, function (error, newOAuth, isUpdated) {
        if (error) return util.sendResponse(res, 500, error.message);
        if (isUpdated) {
            res.cookie('oauth', newOAuth);
        }
        next();
    });
}

module.exports = router;