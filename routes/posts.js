'use strict';
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.render('post.jade', {title: "MasaBlog | Post Template"});
});
module.exports = router;