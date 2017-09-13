'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let fs = require('fs');
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
let CREDENTIAL_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';

router.get('/', isAuthenticated, function (req, res) {
    res.render(
        'admin/dashboard', {title: config.BLOG_NAME + " | Admin", user: req.cookies.user}
    );
});

router.get('/thumbnails', isAuthenticated, function (req, res) {
    co(function *() {
        let thumbnails = (yield thumbnailModel.findAll());
        res.render(
            'admin/gallery', {title: config.BLOG_NAME + " | Gallery", thumbnails: thumbnails, user: req.cookies.user}
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
            'admin/categories', {title: config.BLOG_NAME + " | Category", categories: categories, user: req.cookies.user}
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
            'admin/tags', {title: config.BLOG_NAME + " | Tags", tags: tags, user: req.cookies.user}
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
            'admin/posts', {title: config.BLOG_NAME + " | Posts", posts: posts, user: req.cookies.user}
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
            'admin/post_editor', {title: config.BLOG_NAME + " | Post Editor", post: null, categories: categories, user: req.cookies.user}
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
            'admin/post_editor', {title: config.BLOG_NAME + " | Post Editor", post: post, categories: categories, user: req.cookies.user}
        );
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/passwordReset', isAuthenticated, function (req, res) {
    res.render(
        'admin/password_reset', {title: config.BLOG_NAME + " | Password Reset", user: req.cookies.user}
    );
});

router.get('/profile', isAuthenticated, function (req, res) {
    if (req.cookies.user.gmail_credentials !== null && req.cookies.user.gmail_credentials !== '') {
        fs.readFile(CREDENTIAL_DIR + req.cookies.user.gmail_credentials, function (error, contents) {
            if (error) util.renderError(res, error);
            else {
                res.render(
                    'admin/profile', {title: config.BLOG_NAME + " | Profile", user: req.cookies.user, credentials: JSON.parse(contents)}
                );
            }
        });
    } else {
        res.render(
            'admin/profile', {title: config.BLOG_NAME + " | Profile", user: req.cookies.user, credentials: null}
        );
    }
});

router.get('/messages', isAuthenticated, function (req, res) {
    let now = new Date().getTime();
    let label = req.query.label !== undefined ? req.query.label : null;
    if (req.cookies.oauth === undefined || util.isEmpty(req.cookies.oauth.credentials) || req.cookies.oauth.expired < now) {
        res.clearCookie('oauth');
        gmailHelper.authorizeGoogleAPI(req.cookies.user.gmail_credentials, req.cookies.user.gmail_tokens, function (oauth2Client, error) {
            if (oauth2Client === null && error) {
                util.renderError(res, error);
                console.log(error);
            } else {
                oauth2Client.expired = new Date().getTime() + (24 * 60 * 60 * 1000); // Current Time + 1 day
                res.cookie('oauth', oauth2Client);
                let authURL = (error ? gmailHelper.generateAuthURL(oauth2Client) : null);
                res.render(
                    'admin/mail_management', {title: config.BLOG_NAME + " | Mail Management", authURL: authURL, label: label, user: req.cookies.user}
                );
            }
        });
    } else {
        res.render(
            'admin/mail_management', {title: config.BLOG_NAME + " | Mail Management", authURL: null, label: label, user: req.cookies.user}
        );
    }
});

router.get('/messages/:id', isAuthenticated, function (req, res) {
    let id = req.params.id;
    let oauth = req.cookies.oauth;
    let label = req.query.label !== undefined ? req.query.label : null;
    if (id === undefined || id === '') return util.renderError(res, "Invalid Messsage ID...");
    gmailHelper.getMessage(oauth, id, function (error, response) {
        if (error) util.renderError(res, error);
        else{
            let data = gmailHelper.extractMailBody(response);
            response.html = new Buffer(data.base64, 'base64').toString();
            res.render(
                'admin/mail', {title: config.BLOG_NAME + " | Mail", message: response, attachments: data.attachments, extractFieldHeader: gmailHelper.extractFieldHeader, moment: moment, label: label, user: req.cookies.user}
            );
        }
    });
});

router.get('/auth', isAuthenticated, function (req, res) {
    let code = req.query.code;
    gmailHelper.getToken(req.cookies.oauth, code, req.cookies.user.gmail_tokens, function (error, oauth) {
        if (error) return util.renderError(res, error);
        req.cookies.oauth.credentials = oauth.credentials;
        res.cookie('oauth', req.cookies.oauth);
        res.redirect('/admin/messages');
    });
});

router.get('/comments', isAuthenticated, function (req, res) {
    co(function *() {
        let posts = (yield postModel.findPublishedWithOnlyTitle());
        let length = posts.length;
        let comments = [];
        for (let i = 0; i  < length; i++) {
            let comment = (yield commentModel.countByPost(posts[i].id));
            if (comment.count === 0) continue;
            comment.post_id = posts[i].id;
            comment.title = posts[i].title;
            comments.push(comment);
        }
        res.render(
            'admin/comments_list', {title: config.BLOG_NAME + " | Comments", comments: comments, user: req.cookies.user}
        );
    }).catch(function (e) {
        util.renderError(res, e);
        console.log(e);
    });
});

router.get('/comments/:post_id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.post_id);
        if (!util.isValidId(id)) throw new Error("Invalid Post ID...");
        let comments = (yield commentModel.findByPost(id));
        res.render(
            'admin/comments', {title: config.BLOG_NAME + " | Comments", moment: moment, comments: comments, postId: id, sender: config.MAIL_RECEIVER_USER,user: req.cookies.user}
        );
    }).catch(function (e) {
        util.renderError(res, e);
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
        data.comment = (yield commentModel.count());
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
