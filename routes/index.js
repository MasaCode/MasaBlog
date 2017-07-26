'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
let moment = require('moment');
const nodemailer = require('nodemailer');
let config = require('../docs/environments.js');
let transporter = nodemailer.createTransport({
    service: config.MAIL_PROVIDER,
    auth: {
        user: config.MAIL_SENDER_USER,
        pass: config.MAIL_SENDER_PASSWORD
    }
});
let util = require('../helper/util.js');
let postModel = require('../models/postModel.js');
let categoryModel = require('../models/categoryModel.js');
let tagModel = require('../models/tagModel.js');
let relationModel = require('../models/relationModel.js');

router.get('/', function(req, res, next) {
    co(function *() {
        let postNum = 10;
        let posts = (yield postModel.findAll());
        let count = (yield postModel.count());
        let categories = (yield categoryModel.findAll());
        let data = {};
        data.title = config.BLOG_NAME;
        data.description = config.BLOG_HOME_DESC;
        data.active = 'home';
        res.render('index', { title: config.BLOG_NAME + " | Home", posts: posts, categories: categories, menuData: data, moment: moment});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/about', function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render('about', {title: config.BLOG_NAME + " | About", categories: categories});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/contact', function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render("contact", {title: config.BLOG_NAME + " | Contact", categories: categories});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/posts/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Post ID...');
        let categories = (yield categoryModel.findAll());
        let post = (yield postModel.findById(id));
        let tags = (yield relationModel.findTagsByPost(id));
        res.render('post.jade', {title: config.BLOG_NAME + " | " + post.title, categories: categories, post: post, tags: tags});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/categories/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Category ID...');
        let categories = (yield categoryModel.findAll());
        let selectedCategory = (yield categoryModel.findById(id));
        let posts = (yield postModel.findByCategory(id));
        let data = {};
        data.title = selectedCategory.name;
        data.description = selectedCategory.description;
        data.active = selectedCategory.id;
        res.render(
            'index.jade', {title: config.BLOG_NAME + " | Category Posts", categories: categories, posts: posts, menuData: data, moment: moment}
        );
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/posts/tags/range', function (req, res) {
    co(function *() {
        let ids = req.query.ids;
        let tags = [];
        let length = (ids !== undefined ? ids.length : 0);
        for (let i = 0; i < length; i++) {
            tags.push((yield relationModel.findTagNamesByPost(ids[i])).tags);
        }
        util.sendResponse(res, 200, tags);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

router.get('/tags/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Tag ID...');
        let categories = (yield categoryModel.findAll());
        let posts = (yield relationModel.findPostsByTag(id));
        let selectedTag = (yield tagModel.findById(id));
        let data = {};
        data.title = selectedTag.name;
        data.description = selectedTag.description;
        data.active = '';
        res.render(
            'index.jade', {title: config.BLOG_NAME + " | Tag Posts", categories: categories, posts: posts, menuData: data, moment: moment}
        );
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/search/:text', function (req, res) {
    co(function *() {
        let text = req.params.text;
        if (text === undefined || text === null || text === '') throw new Error('Invalid searching keyword...');
        let resultPosts = (yield postModel.findByText(text));
        let categories = (yield categoryModel.findAll());
        let data = {};
        data.title = 'Searched result of <span class="search-keyword">' + text + '</span>';
        data.description = "";
        data.active = '';
        res.render(
            'index.jade', {title: config.BLOG_NAME + " | Search Result of" + text, categories: categories, posts: resultPosts, menuData: data, moment: moment}
        );
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.post('/contact', function (req, res) {
    let html = [
        '<h2>This is from ' + config.BLOG_NAME + '</h2>',
        '<h3>From : ' + req.body.email + '</h3>',
        '<h3>Name : ' + req.body.name + '</h3>',
        '<h4>Content Body</h4>',
        '<p>' + req.body.body + '</p>'
    ].join('<br>');
    let options = {
        from: '"' + config.BLOG_NAME + '" <' + config.MAIL_SENDER_USER + '>',
        to: config.MAIL_RECEIVER_USER,
        subject: 'Email from ' + config.BLOG_NAME + ' [' + req.body.subject + ']',
        html: html,
    };

    transporter.sendMail(options, function (error, info) {
        if (error) {
            res.contentType('json');
            res.status(500);
            res.send(JSON.stringify(error));
        } else {
            res.contentType('json');
            res.status(200);
            res.send(JSON.stringify(info));
        }
    });
});

module.exports = router;
