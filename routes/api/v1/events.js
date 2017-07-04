'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let eventModel = require('../../../models/eventModel.js');

router.get('/', function (req, res) {
    co(function *() {
        if (!req.cookies.admin || !util.isValidId(parseInt(req.cookies.admin.id))) throw new Error('Invalid Admin ID...');
        let events = (yield eventModel.findByAdmin(req.cookies.admin.id));
        util.sendResponse(res, 200, events);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let event = (yield eventModel.findById(id));
        util.sendResponse(res, 200, event);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/', function (req, res) {
    co(function *() {
        let data = req.body;
        data.is_active = true;
        data.admin_id = parseInt(req.cookies.admin.id);
        if (!util.isValidId(data.admin_id)) throw new Error('Invalid Admin ID...');
        if (!validateParams(data, ['title', 'start', 'end'])) throw new Error('You need to input all the required information...');
        let result = (yield eventModel.insert(data));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.put('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        if (!validateParams(req.body, ['title', 'start', 'end'])) throw new Error('You need to input all the required information...');
        let result = (yield eventModel.update(id, req.body));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.delete('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (id !== parseInt(req.body.id) || !util.isValidId(id)) throw new Error('Invalid ID...');
        let result = (yield eventModel.delete(id));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

function validateParams(data, keys) {
    let length = keys.length;
    for (let i = 0; i < length; i++) {
        let value = data[keys[i]];
        if (value === undefined || value === null || value === '') {
            return false;
        }
    }
    return true;
}

module.exports = router;