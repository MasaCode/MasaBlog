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

router.get('/', function(req, res, next) {
  res.render('index', { title: 'MasaBlog | Home' });
});

router.get('/about', function (req, res) {
  res.render('about', {title: "MasaBlog | About"});
});

router.get('/contact', function (req, res) {
   res.render("contact", {title: "MasaBlog | Contact"});
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
