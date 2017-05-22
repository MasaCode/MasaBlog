var express = require('express');
var router = express.Router();

router.get('/', isAuthenticated, function (req, res) {
    res.render(
        'admin/dashboard', {title: 'MasaBlog | Admin'}
    );
});

router.get('/thumbnails', isAuthenticated, function (req, res) {
   res.render(
       'admin/gallery.jade', {title: 'MasaBlog | Gallery'}
   );
});

router.get('/categories', isAuthenticated, function (req, res) {
    res.render(
        'admin/categories.jade', {title: 'MasaBlog | Category'}
    );
});

router.get('/tags', isAuthenticated, function (req, res) {
    res.render(
        'admin/tags.jade', {title: 'MasaBlog | Tags'}
    );
});

router.get('/posts', isAuthenticated, function (req, res) {
    res.render(
        'admin/posts.jade', {title: 'MasaBlog | Posts'}
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
