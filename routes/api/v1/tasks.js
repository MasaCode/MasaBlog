'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let taskModel = require('../../../models/taskModel.js');

router.get('/', function (req, res) {
    co(function *() {
        if (!req.cookies.admin.id) throw new Error('Invalid admin ID...');
        let tasks = (yield taskModel.findByAdmin(req.cookies.admin.id));
        util.sendResponse(res, 200, tasks);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let task = (yield taskModel.findById(id));
        util.sendResponse(res, 200, task);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/', util.allowAction, function (req, res) {
    co(function *() {
        let id = parseInt(req.cookies.admin.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        if (req.body.description === '' || req.body.description === undefined || req.body.description === null) throw new Error('Description is required...');
        let data = {admin_id: id, description: req.body.description, created_at: new Date()};
        let result = (yield taskModel.insert(data));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.delete('/:id', util.allowAction, function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (id !== parseInt(req.body.id) || !util.isValidId(id)) throw new Error('Invalid ID...');
        let result = (yield taskModel.delete(id));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

module.exports = router;