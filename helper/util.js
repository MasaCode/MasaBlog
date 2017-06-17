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

exports.sendResponse = sendResponse;
exports.renderError = renderError;
exports.getImagePath = getImagePath;
exports.isEmpty = isEmpty;
exports.isValidId = isValidId;