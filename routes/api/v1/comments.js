'use strict';
let express = require('express');
let router = express.Router();
let util = require('../../../helper/util.js');
let co = require('co');
let commentModel = require('../../../models/commentModel.js');

router.get('/', function (req, res) {
    co(function *() {
        let comments = (yield commentModel.findAll());
        util.sendResponse(res, 200, comments);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/post/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Post ID...');
        let comments = (yield commentModel.findByPost(id));
        util.sendResponse(res, 200, comments);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Comment ID...');
        let comment = (yield commentModel.findById(id));
        util.sendResponse(res, 200, comment);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/', function (req, res) {
    co(function *() {
        let regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let data = req.body;
        if (data.post_id === undefined || !util.isValidId(parseInt(data.post_id))) throw new Error('Invalid Post ID...');
        if (data.username === undefined || data.username === '') throw new Error('Username is required...');
        if (data.email === undefined || data.email === '' || !regex.test(data.email)) throw new Error('Email is required...');
        if (data.comments === undefined || data.comments === '') throw new Error('Comment Body is required...');
        let result = (yield commentModel.insert({
            post_id: data.post_id,
            username: data.username,
            email: data.email,
            comments: data.comments,
            date: new Date(),
            is_active: true
        }));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

module.exports = router;