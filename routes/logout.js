'use strict';
let express = require('express');
let router = express.Router();

router.get('/', function (req, res) {
    req.logout();
    res.clearCookie('user', null);
    res.clearCookie('loginMessage', null);
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
