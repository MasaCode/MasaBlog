'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let util = require('../helper/util.js');
let apiHelper = require('../helper/apiHelper.js');
let postModel = require('../models/postModel.js');
let categoryModel = require('../models/categoryModel.js');
let tagModel = require('../models/tagModel.js');
let thumbnailModel = require('../models/thumbnailModel.js');
let taskModel = require('../models/taskModel.js');
let commentModel = require('../models/commentModel.js');
let eventModel = require('../models/eventModel.js');

router.get('/', isAuthenticated, function (req, res) {
    res.render(
        'admin/dashboard', {title: 'MasaBlog | Admin'}
    );
});

router.get('/thumbnails', isAuthenticated, function (req, res) {
    co(function *() {
        let thumbnails = (yield thumbnailModel.findAll());
        res.render(
            'admin/gallery.jade', {title: 'MasaBlog | Gallery', thumbnails: thumbnails}
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
            'admin/categories.jade', {title: 'MasaBlog | Category', categories: categories}
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
            'admin/tags.jade', {title: 'MasaBlog | Tags', tags: tags}
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
            'admin/posts.jade', {title: 'MasaBlog | Posts', posts: posts}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
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
        if (!req.cookies.weather) {
            data.weather = (yield apiHelper.getWeatherInfo());
            let weather = {main: data.weather.main, weather: data.weather.weather, expired: new Date(new Date().getTime() + 30 * 60000)};
            res.cookie('weather', weather, null);
        } else {
            console.log('Cashed data');
            data.weather = req.cookies.weather;
            if (new Date(req.cookies.weather.expired).getTime() < new Date().getTime()) {
                res.clearCookie('weather', null);
            }
        }
        util.sendResponse(res, 200, data);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

function isAuthenticated(req, res, next) {
    if (!req.cookies.admin) {
        res.redirect('/login');
    } else {
        next();
    }
}

module.exports = router;
