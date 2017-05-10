'use strict';
var express = require('express');
var router = express.Router();
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'masacode.vancouver@gmail.com',
        pass: 'Masashi0709'
    }
});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'MasaBlog | Home' });
});

router.get('/about', function (req, res) {
  res.render('about', {title: "MasaBlog | About"});
});

router.get('/contact', function (req, res) {
   res.render("contact", {title: "MasaBlog | Contact"});
});

router.post('/contact', function (req, res) {
    var html = [
        '<h2>This is from MasaBlog</h2>',
        '<h3>From : ' + req.body.email + '</h3>',
        '<h3>Name : ' + req.body.name + '</h3>',
        '<h4>Content Body</h4>',
        '<p>' + req.body.body + '</p>'
    ].join('<br>');
    var options = {
        from: '"MasaBlog" <masacode.vancouver@gmail.com>',
        to: 'masacode.masablog@gmail.com',
        subject: 'Email from MasaBlog',
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
