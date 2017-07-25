'use strict';
let express = require('express');
let router = express.Router();
let fs = require('fs');
let co = require('co');
let multer = require('multer');
let util = require('../../../helper/util.js');
let thumbnailModel = require('../../../models/thumbnailModel.js');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/assets/uploads');
    },
    filename: function (req, file, cb) {
        let today = new Date().toISOString().substr(0, 19).replace(/:/g, '-');
        let splitName = file.originalname.split('.');
        let name = (req.body.title !== undefined && req.body.title !== null && req.body.title !== '') ? req.body.title : splitName[0];
        let fileName = (name + "_" + today + "." + splitName[1]).replace(/ /g, '_');
        cb(null, fileName);
    }
});
let upload = multer({storage: storage}).single('thumbnail');

router.get('/', function (req, res) {
    co(function *() {
        let thumbnails = (yield thumbnailModel.findAll());
        util.sendResponse(res, 200, thumbnails);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/search/:keyword', function (req, res) {
    co(function *() {
        let result = (yield thumbnailModel.findByText(req.params.keyword));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    })
});

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let thumbnail = (yield thumbnailModel.findById(id));
        util.sendResponse(res, 200, thumbnail);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.post('/', util.allowAction, function (req, res) {
    upload(req, res, function (error) {
        co(function *() {
            if (error) throw new Error(error.message);
            let imagePath = util.getImagePath(req.file);
            if (imagePath === null) throw new Error('Thumbnail is required...');
            if (req.body.title === null || req.body.title === undefined || req.body.title === '') {
                fs.unlink('public/assets/uploads/' + imagePath);
                throw new Error('Title is required...');
            }
            let result = (yield thumbnailModel.insert({
                title: req.body.title,
                image_path: imagePath
            }));
            util.sendResponse(res, 200, result);
        }).catch(function (e) {
            util.sendResponse(res, 500, e.message);
            console.log(e);
        });
    });
});

router.delete('/:id', util.allowAction, function (req, res) {
    co(function *() {
        if (parseInt(req.params.id) !== parseInt(req.body.id)) throw new Error('Invalid ID...');
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let thumbnail = (yield thumbnailModel.findById(id));
        fs.unlink('public/assets/uploads/' + thumbnail.image_path);
        let result = (yield thumbnailModel.delete(id));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

module.exports = router;