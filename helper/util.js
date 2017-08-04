'use strict';

/**
 * Send response to ajax call
 *
 * @param  {Object} res Response object
 * @param  {Number} status Status Code of HTTP
 * @param  {Object} data Object of data you want to send back
 */
function sendResponse(res, status, data) {
    res.contentType('json');
    res.status(status);
    res.send(JSON.stringify(data));
}

/**
 * Render an error
 *
 * @param  {Object} res Response object
 * @param  {Object} e Error object
 */
function renderError(res, e) {
    res.render('error', {
        message: e.message,
        error: e
    });
}

/**
 * Get Image File Name from file object
 *
 * @param  {Object} file object that is uploaded
 * @return {String / Null} return file name or null
 */
function getImagePath(file) {
    let imagePath = null;
    if (file !== undefined && file !== null) {
        imagePath = file.filename;
    }
    return imagePath;
}

/**
 * Determine if the object is empty or not
 *
 * @param  {Object} obj Object that you want to check
 * @return {Boolean} return true if the object is empty and return false otherwise
 */
function isEmpty(obj) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

/**
 * Determine if id is valid or not (Only integer id is valid)
 *
 * @param  {Number} id that you want to check
 * @return {Boolean} return true if id is valid and return false otherwise
 */
function isValidId(id) {
    return (typeof id === 'number' && !isNaN(id) && id !== undefined && id !== null);
}

/**
 * Determine if the user is logged in and it is valid
 *
 * @param  {Object} req Request Object
 * @param  {Object} res Response Object
 * @return {Boolean} return true if the user is logged in and valid and return false otherwise
 */
function isAuthenticated(req, res) {
    if (!req.cookies.user) return false;
    let now = new Date().getTime();
    if (!req.cookies.user.expired || now >= parseInt(req.cookies.user.expired)) {
        res.clearCookie('user', null);
        return false;
    }
    return true;
}

/**
 * Determine if the user is allowed to do an action
 *
 * @param  {Object} req Request Object
 * @param  {Object} res Response Object
 * @param  {Function} next Function that call function that is next
 */
function allowAction (req, res, next) {
    if (!isAuthenticated(req, res)) {
        return sendResponse(res, 500, 'Invalid User ID or User permission has expired...');
    }
    next();
}

/**
 * Extract a specific field from header object of gmail
 *
 * @param  {Object} json Message gmail message object
 * @param  {String} fieldName name of field you want to extract
 * @return {String} Value of header object
 */
function extractFieldHeader (json, fieldName) {
    fieldName = fieldName.toLowerCase();
    return json.payload.headers.filter(function(header) {
        return (header.name.toLowerCase() === fieldName);
    })[0].value;
}

/**
 * Generate Random String with specific length
 *
 * @param  {Number} length of string you want to generate
 * @return {String} random string that is created
 */
function generateRandomString(length) {
    let c = "abcdefghijklmnopqrstuvwxyz0123456789";
    let cl = c.length;
    let str = '';
    for(let i = 0; i < length; i++){
        str += c[Math.floor(Math.random()*cl)];
    }
    return str;
}

/**
 * Clone a object without referencing
 *
 * @param  {Object} obj object that you want to copy
 * @return {Object} copy of object
 */
function clone(obj) {
    if (null === obj || "object" !== typeof obj) return obj;
    let copy = obj.constructor();
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

exports.sendResponse = sendResponse;
exports.renderError = renderError;
exports.getImagePath = getImagePath;
exports.isEmpty = isEmpty;
exports.isValidId = isValidId;
exports.isAuthenticated = isAuthenticated;
exports.allowAction = allowAction;
exports.extractFieldHeader = extractFieldHeader;
exports.generateRandomString = generateRandomString;
exports.clone = clone;