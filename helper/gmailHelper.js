let fs = require('fs');
let co = require('co');
let google = require('googleapis');
let googleAuth = require('google-auth-library');

let SCOPES = ['https://mail.google.com/'];
let TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
let TOKEN_PATH = TOKEN_DIR + 'gmail_tokens.json';

function authorizeGoogleAPI(callback) {
    // Load client secrets from a local file.
    fs.readFile(__dirname + '/../docs/client_id.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return callback(null, err);
        }
        // Authorize a client with the loaded credentials, then call the Gmail API.
        authorize(JSON.parse(content), callback);
    });
}

function authorize(credentials, callback) {
    let clientSecret = credentials.web.client_secret;
    let clientId = credentials.web.client_id;
    let redirectUrl = credentials.web.redirect_uris[0];
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            callback(oauth2Client, err);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            if (oauth2Client.credentials.expiry_date >= new Date().getTime()) {
                oauth2Client.getRequestMetadata('', function (error, headers, response) {
                    if (error) callback(oauth2Client, error);
                    else {
                        storeToken(oauth2Client.credentials);
                        callback(oauth2Client, null);
                    }
                });
            } else {
                callback(oauth2Client, null);
            }
        }
    });
}

function generateAuthURL(oauth2Client) {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
}

function getToken(oauth, code, callback) {
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
    oauth2Client.getToken(code, function (err, token) {
        if (err) {
            console.log('Error while trying to retrieve access token', err);
            return callback(err, null);
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(null, oauth2Client);
    });
}

function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}


function getMessageList(oauth, callback) {
    let gmail = google.gmail('v1');
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
    oauth2Client.credentials = oauth.credentials;
    gmail.users.messages.list({
        auth: oauth2Client,
        userId: 'me'
    }, function (error, response) {
        co(function *() {
            if (error) return callback(error, null);
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

function getMessage(oauth, id, callback) {
    let gmail = google.gmail('v1');
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
    oauth2Client.credentials = oauth.credentials;
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

function trashMessages(oauth, ids, callback) {
    co(function *() {
        let gmail = google.gmail('v1');
        let auth = new googleAuth();
        let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
        oauth2Client.credentials = oauth.credentials;
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

function checkRefreshToken(oauth, callback) {
    let gmail = google.gmail('v1');
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(oauth.clientId_, oauth.clientSecret_, oauth.redirectUri_);
    oauth2Client.credentials = oauth.credentials;
    if (oauth2Client.credentials.expiry_date >= new Date().getTime()) {
        oauth2Client.getRequestMetadata('', function (error, headers, response) {
            if (error) callback(error, oauth2Client, true);
            else {
                storeToken(oauth2Client.credentials);
                callback(null, oauth2Client, true);
            }
        });
    } else {
        callback(null, oauth2Client, false);
    }
}

module.exports.authorizeGoogleAPI = authorizeGoogleAPI;
module.exports.getToken = getToken;
module.exports.checkRefreshToken = checkRefreshToken;
module.exports.generateAuthURL = generateAuthURL;
module.exports.getMessageList = getMessageList;
module.exports.getMessage = getMessage;
module.exports.trashMessages = trashMessages;