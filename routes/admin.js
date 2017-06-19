'use strict';
let express = require('express');
let router = express.Router();

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

router.get('/data', isAuthenticated, function (req, res) {
    co(function *() {
        let counts = {};
        counts.category = (yield categoryModel.count());
        counts.tag = (yield tagModel.count());
        counts.thumbnail = (yield thumbnailModel.count());
        util.sendResponse(res, 200, counts);
    }).catch(function (e) {
        util.sendResponse(res, 500, e.message);
        console.log(e);
    });
});

function isAuthenticated(req, res, next) {
    if (!req.cookies.admin) {
        res.redirect('/login');
    } else {
        next();
    }
}

module.exports = router;
