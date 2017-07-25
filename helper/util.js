'use strict';

function sendResponse(res, status, data) {
    res.contentType('json');
    res.status(status);
    res.send(JSON.stringify(data));
}

function renderError(res, e) {
    res.render('error', {
        message: e.message,
        error: e
    });
}

function getImagePath(file) {
    let imagePath = null;
    if (file !== undefined && file !== null) {
        imagePath = file.filename;
    }
    return imagePath;
}

function isEmpty(obj) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function isValidId(id) {
    return (typeof id === 'number' && !isNaN(id) && id !== undefined && id !== null);
}

function isAuthenticated(req, res) {
    if (!req.cookies.admin) return false;
    let now = new Date().getTime();
    if (!req.cookies.admin.expired || now >= parseInt(req.cookies.admin.expired)) {
        res.clearCookie('admin', null);
        return false;
    }
    return true;
}

function allowAction (req, res, next) {
    if (!isAuthenticated(req, res)) {
        return sendResponse(res, 500, 'Invalid Admin ID or Admin permission expired...');
    }
    next();
}

exports.sendResponse = sendResponse;
exports.renderError = renderError;
exports.getImagePath = getImagePath;
exports.isEmpty = isEmpty;
exports.isValidId = isValidId;
exports.isAuthenticated = isAuthenticated;
exports.allowAction = allowAction;