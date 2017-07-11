'use strict';
let express = require('express');
let router = express.Router();
let co = require('co');
const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'masacode.vancouver@gmail.com',
        pass: 'Masashi0709'
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
        let posts = (yield postModel.findInRange(0, postNum));
        let count = (yield postModel.count());
        let categories = (yield categoryModel.findAll());
        res.render('index', { title: 'MasaBlog | Home', posts: posts, categories: categories, count: {length: count.count, postNum: postNum}});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/about', function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render('about', {title: "MasaBlog | About", categories: categories});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/contact', function (req, res) {
    co(function *() {
        let categories = (yield categoryModel.findAll());
        res.render("contact", {title: "MasaBlog | Contact", categories: categories});
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/post/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Post ID...');
        let post = (yield postModel.findById(id));
        res.render('post.jade', {title: "MasaBlog | " + post.title, post: post});
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
        res.render(
            'post_list.jade', {title: 'MasaBlog | Category Posts', categories: categories, posts: posts, selectedCategory: selectedCategory, selectedTag: null}
        );
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.get('/tags/:id', function (req, res) {
    co(function *() {
        let id = parseInt(req.params.id);
        if (!util.isValidId(id)) throw new Error('Invalid Tag ID...');
        let categories = (yield categoryModel.findAll());
        let posts = (yield relationModel.findPostsByTag(id));
        let selectedTag = (yield tagModel.findById(id));
        res.render(
            'post_list.jade', {title: 'MasaBlog | Tag Posts', categories: categories, posts: posts, selectedCategory: null, selectedTag: selectedTag}
        );
    }).catch(function (e) {
        util.renderError(res, e);
    });
});

router.post('/contact', function (req, res) {
    let html = [
        '<h2>This is from MasaBlog</h2>',
        '<h3>From : ' + req.body.email + '</h3>',
        '<h3>Name : ' + req.body.name + '</h3>',
        '<h4>Content Body</h4>',
        '<p>' + req.body.body + '</p>'
    ].join('<br>');
    let options = {
        from: '"MasaBlog" <masacode.vancouver@gmail.com>',
        to: 'masacode.masablog@gmail.com',
        subject: 'Email from MasaBlog [' + req.body.subject + ']',
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
