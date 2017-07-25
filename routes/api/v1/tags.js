'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let tagModel = require('../../../models/tagModel.js');

router.get('/', function (req, res) {
    co(function *() {
        let tags = (yield tagModel.findAll());
        util.sendResponse(res, 200, tags);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let tag = (yield tagModel.findById(id));
        util.sendResponse(res, 200, tag);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/', util.allowAction, function (req, res) {
    co(function *() {
        let body = req.body;
        if (body.name === '' || body.name === null || body.name === undefined) throw new Error('Category name is required..');
        let result = (yield tagModel.insert({
            name: body.name,
            description: (body.description !== '' && body.description !== null && body.description !== undefined) ? body.description : '',
            is_active: true
        }));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/searchInsert', util.allowAction, function (req, res) {
    co(function *() {
        if (req.body === undefined || req.body.name === undefined || req.body.name === '' || req.body.name === null) throw new Error('Tag Name is required...');
        let name = req.body.name;
        let tag = (yield tagModel.findByName(name));
        if (tag !== null) {
            return util.sendResponse(res, 200, tag.id);
        }
        let result = (yield tagModel.insert({name: name, description: '', is_active: true}));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.put('/:id', util.allowAction, function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        let data = {};
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        if (req.body.name !== null && req.body.name !== undefined && req.body.name !== '') data.name = req.body.name;
        if (req.body.description !== null && req.body.description !== undefined && req.body.description !== '') data.description = req.body.description;
        if (util.isEmpty(data)) throw new Error('No updated data is found...');
        let result = (yield tagModel.update(id, data));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.delete('/:id', util.allowAction, function (req, res) {
    co(function *() {
        if (parseInt(req.params.id) !== parseInt(req.body.id)) throw new Error('Invalid ID...');
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let result = (yield tagModel.delete(id));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

module.exports = router;