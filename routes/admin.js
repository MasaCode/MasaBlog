'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let moment = require('moment');
let config  = require('../docs/environments.js');
let util = require('../helper/util.js');
let apiHelper = require('../helper/apiHelper.js');
let gmailHelper = require('../helper/gmailHelper.js');
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
        'admin/dashboard', {title: config.BLOG_NAME + " | Admin", user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
    );
});

router.get('/thumbnails', isAuthenticated, function (req, res) {
    co(function *() {
        let thumbnails = (yield thumbnailModel.findAll());
        res.render(
            'admin/gallery.jade', {title: config.BLOG_NAME + " | Gallery", thumbnails: thumbnails, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
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
            'admin/categories.jade', {title: config.BLOG_NAME + " | Category", categories: categories, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
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
            'admin/tags.jade', {title: config.BLOG_NAME + " | Tags", tags: tags, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
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
            'admin/posts.jade', {title: config.BLOG_NAME + " | Posts", posts: posts, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/posts/new', isAuthenticated, function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render(
            'admin/post_editor.jade', {title: config.BLOG_NAME + " | Post Editor", post: null, categories: categories, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/posts/edit/:id', isAuthenticated, function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Post ID...');
        let post = (yield postModel.findById(id));
        let categories = (yield categoryModel.findAll());
        res.render(
            'admin/post_editor.jade', {title: config.BLOG_NAME + " | Post Editor", post: post, categories: categories, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/passwordReset', isAuthenticated, function (req, res) {
    res.render(
        'admin/password_reset.jade', {title: config.BLOG_NAME + " | Password Reset", user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
    );
});

router.get('/profile', isAuthenticated, function (req, res) {
    res.render(
        'admin/profile.jade', {title: config.BLOG_NAME + " | Profile", user: req.cookies.user}
    );
});

router.get('/messages', isAuthenticated, function (req, res) {
    let now = new Date().getTime();
    if (req.cookies.oauth === undefined || util.isEmpty(req.cookies.oauth.credentials) || req.cookies.oauth.expired < now) {
        res.clearCookie('oauth');
        gmailHelper.authorizeGoogleAPI(function (oauth2Client, error) {
            if (oauth2Client === null && error) {
                util.renderError(res, error);
                console.log(error);
            } else {
                oauth2Client.expired = new Date().getTime() + (24 * 60 * 60 * 1000); // Current Time + 1 day
                res.cookie('oauth', oauth2Client);
                let authURL = (error ? gmailHelper.generateAuthURL(oauth2Client) : null);
                res.render(
                    'admin/mail_management.jade', {title: config.BLOG_NAME + " | Mail Management", authURL: authURL, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
                );
            }
        });
    } else {
        res.render(
            'admin/mail_management.jade', {title: config.BLOG_NAME + " | Mail Management", authURL: null, user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}}
        );
    }
});

router.get('/messages/:id', isAuthenticated, function (req, res) {
    let id = req.params.id;
    let oauth = req.cookies.oauth;
    if (id === undefined || id === '') return util.renderError(res, "Invalid Messsage ID...");
    gmailHelper.getMessage(oauth, id, function (error, response) {
        if (error) util.renderError(res, error);
        else{
            let base64 = '';
            if (Array.isArray(response.payload.parts)) {
                let part = response.payload.parts.filter(function (part) {
                    return part.mimeType === 'text/html';
                });
                base64 = part[0].body.data;
            } else {

                base64 = response.payload.body.data;
            }
            response.html = new Buffer(base64, 'base64').toString();
            res.render(
                'admin/mail.jade', {
                    title: config.BLOG_NAME + " | Mail",
                    message: response,
                    extractFieldHeader: util.extractFieldHeader,
                    moment: moment,
                    user: {image_path: req.cookies.user.image_path, username: req.cookies.user.username}
                }
            );
        }
    });
});

router.get('/auth', isAuthenticated, function (req, res) {
    let code = req.query.code;
    gmailHelper.getToken(req.cookies.oauth, code, function (error, oauth) {
        if (error) return util.renderError(res, error);
        req.cookies.oauth.credentials = oauth.credentials;
        res.cookie('oauth', req.cookies.oauth);
        res.redirect('/admin/messages');
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
        data.events = (yield eventModel.findByAdmin(req.cookies.user.id));
        data.tasks = (yield taskModel.findByAdmin(req.cookies.user.id));
        if (!req.cookies.weather || parseInt(req.cookies.weather) < new Date().getTime()) {
            data.weather = (yield apiHelper.getWeatherInfo(req.cookies.user.location, req.cookies.user.weather_api));
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
