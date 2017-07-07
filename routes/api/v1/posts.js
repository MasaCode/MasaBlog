'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../../../helper/util.js');
let postModel = require('../../../models/postModel.js');
let relationModel = require('../../../models/relationModel.js');

router.get('/', function (req, res) {
    co(function *() {
        let posts = (yield postModel.findAll());
        util.sendResponse(res, 200, posts);
    }).catch(function (e) {
        console.log(e);
        util.sendResponse(res, 500, e.message);
    });
});

router.get('/search/:keyword', function (req, res) {
    co(function *() {
        let searchedResult = (yield postModel.findByText(req.params.keyword));
        util.sendResponse(res, 200, searchedResult);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid ID...');
        let post = postModel.findById(id);
        util.sendResponse(res, 200, post);
    }).catch(function (e) {
        console.log(e);
        util.sendResponse(res, 500, e.message);
    });
});

router.post('/', function (req, res) {
    co(function *() {
        if (!util.isValidId(parseInt(req.cookies.admin.id))) throw new Error('Admin id is not defined...');
        if (!util.isValidId(parseInt(req.body.category))) throw new Error('Invalid Category ID...');
        let tags = req.body.tags.split(',');
        if (!validateTagId(tags)) throw new Error('Invalid Tag ID...');
        let validateResult = validateParams(req.body, req.cookies.admin.id);
        if (validateResult.error) throw new Error(validateResult.error);
        let postResult = (yield postModel.insert(validateResult.data));
        let categoryResult = (yield relationModel.insertPostCategory({post_id: postResult, category_id: req.body.category}));
        let tagResult = (yield relationModel.insertPostTags(postResult, tags));
        util.sendResponse(res, 200, {post: postResult, category: categoryResult, tag: tagResult});
    }).catch(function (e) {
        console.log(e);
        util.sendResponse(res, 500, e.message);
    });
});

router.post('/relatedTag', function (req, res) {
    co(function *() {
        let post_id = parseInt(req.body.post_id);
        let tag_id = parseInt(req.body.tag_id);
        if (!util.isValidId(post_id)) throw new Error('Invalid Post ID...');
        if (!util.isValidId(tag_id)) throw new Error('Invalid Tag ID...');
        let result = (yield relationModel.insertPostTag({post_id: post_id, tag_id: tag_id}));
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
        let result = (yield postModel.update(id, {
            title: req.body.title,
            description: req.body.description,
            body: req.body.body,
            image_path: req.body.image_path
        }));
        if (req.body.category) {
            let cateogryResul = (yield relationModel.updatePostCategoryByPostId(id, req.body.category));
        }
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        console.log(e);
        util.sendResponse(res, 500, e.message);
    });
});

router.delete('/relatedTag', function (req, res) {
    co(function *() {
        let post_id = parseInt(req.body.post_id);
        let tag_id = parseInt(req.body.tag_id);
        if (!util.isValidId(post_id)) throw new Error('Invalid Post ID...');
        if (!util.isValidId(tag_id)) throw new Error('Invalid Tag ID...');
        let result = (yield relationModel.deletePostTagByIds(post_id, tag_id));
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
        let result = (yield postModel.delete(id));
        util.sendResponse(res, 200, result);
    }).catch(function (e) {
        console.log(e);
        util.sendResponse(res, 500, e.message);
    });
});

function validateParams(params, admin_id) {
    let error = null;
    if (params.title === '' || params.title === undefined || params.title === null) error = 'TItle is required...';
    if (params.image_path === '' || params.image_path === undefined || params.image_path === null) error = 'Cover image is required...';
    if (params.description === '' || params.description === undefined || params.description === null) error = 'Description is required...';
    if (params.body === '' || params.body === undefined || params.body === null) error = 'Content body is required...';
    if (error) return {error: error, data: null};

    let data = {};
    data.title = params.title;
    data.image_path = params.image_path;
    data.description = params.description;
    data.body = params.body;
    data.is_active = true;
    data.created_at = new Date();
    data.admin_id = admin_id;
    data.sequence = 0;
    return {error: null, data: data};
}


function validateTagId(tags) {
    let length = tags.length;
    for (let i = 0; i < length; i++) {
        if (!util.isValidId(parseInt(tags[i]))) {
            return false;
        }
    }
    return true;
}

module.exports = router;