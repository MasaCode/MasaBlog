let fs = require('fs');
let co = require('co');
let google = require('googleapis');
let googleAuth = require('google-auth-library');
let util = require('./util.js');

let SCOPES = ['https://mail.google.com/'];
let TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';

/**
 * Interface of Authorizing Google API with credential information
 *
 * @param  {String} gmail_credentials of the files that contains gmail credentials
 * @param  {String} gmail_tokens of the files that contains gmail tokens
 * @param  {Function} callback Function(OAuth2Client, Error) that is called when request is completed.
 */
function authorizeGoogleAPI(gmail_credentials, gmail_tokens, callback) {
    // Load client secrets from a local file.
    fs.readFile(TOKEN_DIR + gmail_credentials, function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return callback(null, err);
        }
        // Authorize a client with the loaded credentials, then call the Gmail API.
        authorize(JSON.parse(content), gmail_tokens, callback);
    });
}

/**
 * Authorize Google API with credential information
 *
 * @param  {Object} credentials object contains credential (client secret, client id, redirect url)
 * @param  {String} gmail_tokens of the files that contains gmail tokens
 * @param  {Function} callback Function(OAuth2Client, Error) that is called when request is completed.
 */
function authorize(credentials, gmail_tokens, callback) {
    let clientSecret = credentials.web.client_secret;
    let clientId = credentials.web.client_id;
    let redirectUrl = credentials.web.redirect_uris[0];
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_DIR + gmail_tokens, function (err, token) {
        if (err) {
            callback(oauth2Client, err);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            if (oauth2Client.credentials.expiry_date >= new Date().getTime()) {
                oauth2Client.getRequestMetadata('', function (error, headers, response) {
                    if (error) callback(oauth2Client, error);
                    else {
                        storeToken(gmail_tokens, oauth2Client.credentials);
                        callback(oauth2Client, null);
                    }
                });
            } else {
                callback(oauth2Client, null);
            }
        }
    });
}

/**
 * Generate URL to authorize Google Account to use it for your application
 *
 * @param  {Object} oauth2Client object that's not authorized
 * @return {String} URL for authorizing google account
 */
function generateAuthURL(oauth2Client) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
}

/**
 * Get Tokens from code and create authorized oauth2Client object
 *
 * @param  {Object} oauth object that includes credential information
 * @param  {String} code string that contains tokens and expiration date of it
 * @param  {String} gmail_tokens of the files that contains gmail tokens
 * @param  {Function} callback Function(OAuth2Client, Error) that is called when request is completed.
 */
function getToken(oauth, code, gmail_tokens, callback) {
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
    oauth2Client.getToken(code, function (err, token) {
        if (err) {
            console.log('Error while trying to retrieve access token', err);
            return callback(err, null);
        }
        oauth2Client.credentials = token;
        storeToken(gmail_tokens, token);
        callback(null, oauth2Client);
    });
}

/**
 * Store tokens into file
 *
 * @param  {String} fileName of gmail tokens file
 * @param  {Object} token object that contains access token, refresh token and expiration date
 */
function storeToken(fileName, token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_DIR + fileName, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_DIR + fileName);
}

/**
 * Get array of messages in gmail inbox
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {Function} callback Function(Error, Messages) that is called when request is completed.
 */
function getMessageList(oauth, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);
    gmail.users.messages.list({
        auth: oauth2Client,
        userId: 'me'
    }, function (error, response) {
        co(function *() {
            if (error) return callback(error, null);
            if (!Array.isArray(response.messages)) return callback(null, []);
            let length = response.messages.length;
            let messages = [];
            for (let i = 0; i < length; i++) {
                let message = (yield getMessageHeader(gmail, oauth2Client, response.messages[i].id));
                messages.push(message);
            }
            callback(null, messages);
        }).catch(function (e) {
            callback(e, null);
        });
    });
}

/**
 * Search message in gmail inbox
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {String} query for searching inbox (e.g. "is:starred", "in:sent", "in:draft", "is:important", "in:trash")
 * @param  {Function} callback Function(Error, Messages) that is called when request is completed.
 */
function searchMailBox(oauth, query, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);
    gmail.users.messages.list({
        auth: oauth2Client,
        userId: 'me',
        q: query,
    }, function (error, response) {
        co(function *() {
            if (error) return callback(error, null);
            if (!Array.isArray(response.messages)) return callback(null, []);
            let length = response.messages.length;
            let messages = [];
            for (let i = 0; i < length; i++) {
                let message = (yield getMessageHeader(gmail, oauth2Client, response.messages[i].id));
                messages.push(message);
            }
            callback(null, messages);
        }).catch(function (e) {
            callback(e, null);
        });
    });
}

/**
 * Get a specific message's headers like subject, sender, received date, labels and etc...
 *
 * @param  {Object} gmail object that contains request methods
 * @param  {Object} auth(oauth2Client) object that includes credential information and tokens
 * @param  {String} id of specific message
 */
function getMessageHeader(gmail, auth, id) {
    return new Promise((resolve, reject) => {
        gmail.users.messages.get({
            auth: auth,
            userId: 'me',
            id: id,
            format: 'metadata'
        }, function (error, response) {
            if (error) reject(error);
            else resolve(response);
        });
    });
}

/**
 * Get full information of a specific message
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {String} id of specific message
 * @param  {Function} callback Function(Error, Message) that is called when request is completed.
 */
function getMessage(oauth, id, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);
    gmail.users.messages.get({
        auth: oauth2Client,
        userId: 'me',
        id: id,
        format: 'full',
    }, function (error, response) {
        if (error) callback(error, null);
        else callback(null, response);
    });
}

/**
 * Move message(s) to trash
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {Array} ids of messages
 * @param  {Function} callback Function(Error, Results) that is called when request is completed.
 */
function trashMessages(oauth, ids, callback) {
    co(function *() {
        let gmail = google.gmail('v1');
        let oauth2Client = createOAuth(oauth);
        let length = ids.length;
        let results = [];
        for (let i = 0; i < length; i++) {
            let result = (yield trashMessage(gmail, oauth2Client, ids[i]));
            results.push(result);
        }
        callback(null, results);
    }).catch(function (e) {
        callback(e, null);
    });
}

/**
 * Move a specific message to trash
 *
 * @param  {Object} gmail object that contains request methods
 * @param  {Object} auth(oauth) object that includes credential information and tokens
 * @param  {String} id of a specific message
 */
function trashMessage(gmail, auth, id) {
    return new Promise((resolve, reject) => {
        gmail.users.messages.trash({
            auth: auth,
            userId: 'me',
            id: id,
        }, function (error, response) {
            if (error) reject(error);
            else resolve(response);
        });
    });
}

/**
 * Move message(s) back to inbox from trash
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {Array} ids of messages
 * @param  {Function} callback Function(Error, Results) that is called when request is completed.
 */
function untrashMessages(oauth, ids, callback) {
    co(function *() {
        let gmail = google.gmail('v1');
        let oauth2Client = createOAuth(oauth);
        let length = ids.length;
        let results = [];
        for (let i = 0; i < length; i++) {
            let result = (yield untrashMessage(gmail, oauth2Client, ids[i]));
            results.push(result);
        }
        callback(null, results);
    }).catch(function (e) {
        callback(e, null);
    });
}

/**
 * Move a specific message back to inbox from trash
 *
 * @param {Object} gmail object that contains request methods
 * @param  {Object} auth(oauth) object that includes credential information and tokens
 * @param  {String} id of a specific message
 */
function untrashMessage(gmail, auth, id) {
    return new Promise((resolve, reject) => {
        gmail.users.messages.untrash({
            auth: auth,
            userId: 'me',
            id: id,
        }, function (error, response) {
            if (error) reject(error);
            else resolve(response);
        });
    });
}

/**
 * Modify labels of a specific message
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {String} id of a specific message
 * @param  {Array} labelToAdd Array of labels to add
 * @param  {Array} labelToRemove Array of labels to remove
 * @param  {Function} callback Function(Error, Result) that is called when request is completed.
 */
function modifyMessageLabel(oauth, id, labelToAdd, labelToRemove, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);
    gmail.users.messages.modify({
        auth: oauth2Client,
        userId: 'me',
        id: id,
        resource: {
            addLabelIds: labelToAdd,
            removeLabelIds: labelToRemove,
        },
    }, function (error, response) {
        if (error) callback(error, null);
        else callback(null, response);
    });
}

/**
 * Send email via gmail
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {Object} headers object that contains header information like sender, receiver, Mine type, and etc...
 * @param  {String} message mail content body
 * @param  {Function} callback Function(Error, Result) that is called when request is completed.
 */
function sendMessage(oauth, headers, message, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);
    let email = '';
    for(let key in headers) {
        email += (key + ": " + headers[key] + "\r\n");
    }
    email += "\r\n" + message;

    gmail.users.messages.send({
        auth: oauth2Client,
        'userId': 'me',
        'resource': {
            'raw': new Buffer(email).toString("base64").replace(/\+/g, '-').replace(/\//g, '_'),
        }
    }, function (error, response) {
        if (error) callback(error, null);
        else callback(null, response);
    });
}

/**
 * Check the expiration of access token and if so, renew access token by refresh token
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {String} gmail_tokens of the files that contains gmail tokens
 * @param  {Function} callback Function(Error, oauth2client, isUpdated) that is called when request is completed.
 */
function checkRefreshToken(oauth, gmail_tokens, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);
    if (oauth2Client.credentials.expiry_date >= new Date().getTime()) {
        oauth2Client.getRequestMetadata('', function (error, headers, response) {
            if (error) callback(error, oauth2Client, true);
            else {
                storeToken(gmail_tokens, oauth2Client.credentials);
                callback(null, oauth2Client, true);
            }
        });
    } else {
        callback(null, oauth2Client, false);
    }
}

/**
 * Create OAuth2Client object from credential information and tokens
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @return {Object} OAuth2Client object that is created
 */
function createOAuth(oauth) {
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
    oauth2Client.credentials = oauth.credentials;
    return oauth2Client;
}

module.exports.authorizeGoogleAPI = authorizeGoogleAPI;
module.exports.getToken = getToken;
module.exports.checkRefreshToken = checkRefreshToken;
module.exports.generateAuthURL = generateAuthURL;
module.exports.getMessageList = getMessageList;
module.exports.getMessage = getMessage;
module.exports.trashMessages = trashMessages;
module.exports.untrashMessages = untrashMessages;
module.exports.modifyMessageLabel = modifyMessageLabel;
module.exports.searchMailBox = searchMailBox;
module.exports.sendMessage = sendMessage;