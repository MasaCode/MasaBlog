'use strict';
let express = require('express');
let router = express.Router();

router.get('/', function (req, res) {
    res.render('post.jade', {title: "MasaBlog | Post Template"});
});
module.exports = router;