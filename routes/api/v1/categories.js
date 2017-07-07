'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let categoryModel = require('../../../models/categoryModel.js');

router.get('/', function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        util.sendResponse(res, 200, categories);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/:id', function (req, res) {
   co(function *() {
       let id = parseInt(req.params.id);
       if (!util.isValidId(id)) throw new Error('Invalid ID...');
       let category = (yield categoryModel.findById(id));
       util.sendResponse(res, 200, category);
   }).catch(function (e) {
       util.sendResponse(res, 500, e.message);
       console.log(e);
   });
});

router.post('/', function (req, res) {
    co(function *() {
        let body = req.body;
        if (body.name === '' || body.name === null || body.name === undefined) throw new Error('Category name is required..');
        let result = (yield categoryModel.insert({
            name: body.name,
            description: (body.description !== '' && body.description !== null && body.description !== undefined) ? body.description : '',
            is_active: true
        }));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    })
});

router.put('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        let data = {};
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        if (req.body.name !== null && req.body.name !== undefined && req.body.name !== '') data.name = req.body.name;
        if (req.body.description !== null && req.body.description !== undefined && req.body.description !== '') data.description = req.body.description;
        if (util.isEmpty(data)) throw new Error('No updated data is found...');
        let result = (yield categoryModel.update(id, data));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.delete('/:id', function (req, res) {
    co(function *() {
        if (parseInt(req.params.id) !== parseInt(req.body.id)) throw new Error('Invalid ID...');
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let result = (yield categoryModel.delete(id));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    })
});

module.exports = router;