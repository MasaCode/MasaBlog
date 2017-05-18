var express = require('express');
var router = express.Router();

router.get('/', isAuthenticated, function (req, res) {
    res.render(
        'admin/dashboard', {title: 'MasaBlog | Admin'}
    );
});

function isAuthenticated(req, res, next) {
    if (!req.cookies.admin) {
        res.redirect('/login');
    } else {
        next();
    }
}

module.exports = router;
