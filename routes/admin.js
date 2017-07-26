'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let config  = require('../docs/environments.js');
let util = require('../helper/util.js');
let apiHelper = require('../helper/apiHelper.js');
let postModel = require('../models/postModel.js');
let categoryModel = require('../models/categoryModel.js');
let tagModel = require('../models/tagModel.js');
let thumbnailModel = require('../models/thumbnailModel.js');
let taskModel = require('../models/taskModel.js');
let commentModel = require('../models/commentModel.js');
let eventModel = require('../models/eventModel.js');
let relationModel = require('../models/relationModel.js');

router.get('/', isAuthenticated, function (req, res) {
    res.render(
        'admin/dashboard', {title: config.BLOG_NAME + " | Admin"}
    );
});

router.get('/thumbnails', isAuthenticated, function (req, res) {
    co(function *() {
        let thumbnails = (yield thumbnailModel.findAll());
        res.render(
            'admin/gallery.jade', {title: config.BLOG_NAME + " | Gallery", thumbnails: thumbnails}
        );
    }).catch(function (e) {
        console.log(e);
        util.renderError(res, e);
    });
});

router.get('/categories', isAuthenticated, function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render(
            'admin/categories.jade', {title: config.BLOG_NAME + " | Category", categories: categories}
        );
    }).catch(function (e) {
        console.log(e);
        util.renderError(res, e);
    });
});

router.get('/tags', isAuthenticated, function (req, res) {
    co(function *() {
        let tags = (yield tagModel.findAll());
        res.render(
            'admin/tags.jade', {title: config.BLOG_NAME + " | Tags", tags: tags}
        );
    }).catch(function (e) {
        console.log(e);
        util.renderError(res, e);
    });
});

router.get('/posts', isAuthenticated, function (req, res) {
    co(function *() {
        let posts = (yield postModel.findAll());
        res.render(
            'admin/posts.jade', {title: config.BLOG_NAME + " | Posts", posts: posts}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/posts/new', function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render(
            'admin/post_editor.jade', {title: config.BLOG_NAME + " | Post Editor", post: null, categories: categories}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/posts/edit/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Post ID...');
        let post = (yield postModel.findById(id));
        let categories = (yield categoryModel.findAll());
        res.render(
            'admin/post_editor.jade', {title: config.BLOG_NAME + " | Post Editor", post: post, categories: categories}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/passwordReset', function (req, res) {
    res.render(
        'admin/password_reset.jade', {title: config.BLOG_NAME + " | Password Reset"}
    );
});

router.get('/data', isAuthenticated, function (req, res) {
    co(function *() {
        let data = {};
        data.post = {};
        data.post.count = (yield postModel.count()).count;
        data.post.posts = (yield postModel.findRecent(7));
        data.category = (yield categoryModel.count());
        data.tag = (yield tagModel.count());
        data.thumbnail = (yield thumbnailModel.count());
        data.comment = (yield commentModel.findAll());
        data.events = (yield eventModel.findByAdmin(req.cookies.admin.id));
        data.tasks = (yield taskModel.findByAdmin(req.cookies.admin.id));
        if (!req.cookies.weather || parseInt(req.cookies.weather) < new Date().getTime()) {
            data.weather = (yield apiHelper.getWeatherInfo());
            let weather = {main: data.weather.main, weather: data.weather.weather, expired: new Date(new Date().getTime() + 30 * 60000)};
            res.cookie('weather', weather, null);
        } else {
            console.log('Cashed data');
            data.weather = req.cookies.weather;
        }
        util.sendResponse(res, 200, data);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/posts/data/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Post ID...');
        let relatedTags = (yield relationModel.findTagsByPost(id));
        util.sendResponse(res, 200, {tags: relatedTags});
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

function isAuthenticated(req, res, next) {
    if (!util.isAuthenticated(req, res)) return res.redirect('/login');
    next();
}

module.exports = router;
