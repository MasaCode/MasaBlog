var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    req.logout();
    res.clearCookie('admin', null);
    res.clearCookie('loginMessage', null);
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
