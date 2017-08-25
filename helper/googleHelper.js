let fs = require('fs');
let co = require('co');
let google = require('googleapis');
let googleAuth = require('google-auth-library');
let util = require('./util.js');

let SCOPES = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar',
];
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
        approval_prompt: 'force',
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
 * Get Profile of gmail account
 *
 * @param  {Object} oauth object that includes credential information and tokens
 */
function getProfile (oauth) {
    return new Promise((resolve, reject) => {
        let people = google.people('v1');
        let oauth2Client = createOAuth(oauth);
        people.people.get({
            auth: oauth2Client,
            resourceName: 'people/me',
            personFields: 'emailAddresses,names',
        }, (error, response) => {
            if (error) reject(error);
            else {
                let name = response.names[0].displayName;
                let email = response.emailAddresses[0].value;
                resolve({name: name, email: email});
            }
        });
    });
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
 * Get attachment(s) of specific message
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {String} id of specific message
 * @param  {Array} attachmentIds an array of attachment ids
 * @param  {Function} callback Function(Error, Attachments) that is called when request is completed.
 */
function getAttachments(oauth, id, attachmentIds, callback) {
    co(function *() {
        let gmail = google.gmail('v1');
        let oauth2Client = createOAuth(oauth);
        let length = attachmentIds.length;
        let attachments = [];
        for (let i = 0; i < length; i++) {
            let attachment = (yield getAttachment(gmail, oauth2Client, id, attachmentIds[i]));
            attachments.push(attachment);
        }
        callback(null, attachments);
    }).catch(function (e) {
        callback(e, null);
        console.log(e);
    });
}

/**
 * Get a specific attachment of specific message
 *
 * @param  {Object} gmail object that contains request methods
 * @param  {Object} auth(oauth) object that includes credential information and tokens
 * @param  {String} messageId of specific message
 * @param  {Array} attachmentId of specific attachment
 */
function getAttachment(gmail, auth, messageId, attachmentId) {
    return new Promise((resolve, reject) => {
        gmail.users.messages.attachments.get({
            auth: auth,
            userId: 'me',
            messageId: messageId,
            id: attachmentId,
        }, (error, response) => {
            if (error) reject(error);
            else resolve(response);
        });
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
    let email = [
        'MIME-Version: 1.0\r\n',
        'charset: \"UTF-8\"\r\n',
        'Content-Transfer-Encoding: 7bit\r\n',
        'Content-Type: ' + headers['Content-Type'] + '\r\n',
        (headers['In-Reply-To'] !== undefined ? ('In-Reply-To: ' + headers['In-Reply-To'] + '\r\n') : ''),
        'to: ' + headers['to'] + '\r\n',
        'from: ' + headers['from'] + '\r\n',
        'subject: ' + headers['subject'] + '\r\n',
        '\r\n' + message
    ].join('');

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
 * Send email with attachment(s) via gmail
 *
 * @param  {Object} oauth object that includes credential information and tokens
 * @param  {Object} headers object that contains header information like sender, receiver, Mine type, and etc...
 * @param  {String} message mail content body
 * @param  {String} boundary the string to separate multi part of mail body
 * @param  {Array} attachments an Array of Object that contains data, name, type
 * @param  {Function} callback Function(Error, Result) that is called when request is completed.
 */
function sendMessageWithAttachment(oauth, headers, message, boundary, attachments, callback) {
    let gmail = google.gmail('v1');
    let oauth2Client = createOAuth(oauth);

    let email = [
        'Content-Type: multipart/mixed; boundary="' + boundary + '"\r\n',
        'MIME-Version: 1.0\r\n',
        (headers['In-Reply-To'] !== undefined ? ('In-Reply-To: ' + headers['In-Reply-To'] + '\r\n') : ''),
        'to: ' + headers['to'] + '\r\n',
        'from: ' + headers['from'] + '\r\n',
        'subject: ' + headers['subject'] + '\r\n\r\n',
        '--' + boundary + '\r\n',

        'Content-Type: ' + headers['Content-Type'] + '; charset="UTF-8"\r\n',
        'MIME-Version: 1.0\r\n',
        'Content-Transfer-Encoding: 7bit\r\n',
        '\r\n' + message + '\r\n\r\n',
        '--' + boundary + '\r\n',
    ].join('');

    let attachmentLength = attachments.length;
    for (let i = 0; i < attachmentLength; i++) {
        email += ('Content-Type: ' + attachments[i].type + '\r\n');
        email += 'MIME-Version: 1.0\r\n';
        email += 'Content-Transfer-Encoding: base64\r\n';
        email += ('Content-Disposition: attachment; filename="' + attachments[i].name + '"\r\n\r\n');
        email += (attachments[i].data + '\r\n\r\n');
        email += ('--' + boundary + (i === (attachmentLength - 1) ? '--' : '\r\n'));
    }

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

/**
 * Extract mail body and attachments from specific message
 *
 * @param  {Object} response gmail message object
 * @return {Object} extracted mail body and attachments information
 */
function extractMailBody(response) {
    let base64 = null, base64Plain = null;
    let attachments = [];
    let parts = [response.payload];
    while (parts.length) {
        let part = parts.shift();
        if (part.parts) {
            parts = parts.concat(part.parts);
        }

        if (part.mimeType === 'text/plain') {
            // Just in case message doesn't have text/plain version.
            base64Plain = part.body.data;
        } if(part.mimeType === 'text/html') {
            base64 = part.body.data;
        } else if (part.body.attachmentId) {
            let attachment = {};
            attachment.id = part.body.attachmentId;
            attachment.filename = part.filename;
            attachment.contentType = part.mimeType;
            attachments.push(attachment);
        }
    }

    return {base64: (base64 !== null ? base64 : base64Plain), attachments: attachments};
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
    let header = json.payload.headers.filter(function(header) {
        return (header.name.toLowerCase() === fieldName);
    });
    return (header.length !== 0 ? header[0].value : '');
}

module.exports.authorizeGoogleAPI = authorizeGoogleAPI;
module.exports.getToken = getToken;
module.exports.checkRefreshToken = checkRefreshToken;
module.exports.generateAuthURL = generateAuthURL;
module.exports.getProfile = getProfile;
module.exports.getMessageList = getMessageList;
module.exports.getMessage = getMessage;
module.exports.getAttachments = getAttachments;
module.exports.trashMessages = trashMessages;
module.exports.untrashMessages = untrashMessages;
module.exports.modifyMessageLabel = modifyMessageLabel;
module.exports.searchMailBox = searchMailBox;
module.exports.sendMessage = sendMessage;
module.exports.sendMessageWithAttachment = sendMessageWithAttachment;
module.exports.extractMailBody = extractMailBody;
exports.extractFieldHeader = extractFieldHeader;