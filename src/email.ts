const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');



// If modifying these scopes, delete token.json.
//const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const SCOPES = ['https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = '../token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    console.log("Method readFile has been called")
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    //authorize(JSON.parse(content), listLabels);
    authorize(JSON.parse(content), listMessages);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
 export function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.labels.list({
        userId: 'me',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        if (labels.length) {
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name}`);
            });
        } else {
            console.log('No labels found.');
        }
    });


}

export function listMessages(auth) {
    const gmail = google.gmail({version: 'v1', auth});

    gmail.users.messages.list({
        labelIds: ['INBOX', 'UNREAD', 'CATEGORY_PERSONAL'],
        maxResults: 1,
        userId: 'me',
        q: 'from:academy@blazemeter.com'
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        console.log(res.data)
        const messages = res.data.messages;
        if (messages === undefined) {
            throw new Error("Request returns no messages")
        } else {
            if (messages.length) {
                console.log('Message:');
                console.log(messages[0].id);
                /*
                List of messages. Note that each message resource contains only an id and a threadId.
                 Additional message details can be fetched using the messages.get method.
                 */
                messages.forEach((mess) => {
                    getMessage(mess.id, 'me', auth);
                })
            } else {
                console.log('No labels found.');
            }
        }
    });
}

function getMessage(messageId, userId, auth) {
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.messages.get({
        'userId': userId,
        'id': messageId,
        'format': 'raw',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);

        let Base64 = require('js-base64').Base64;
        let messageValue = Base64.decode(res.data.raw)
        urlify(messageValue)
        ;
    });
}

function urlify(text) {
    let urlRegex = /(https?:\/\/[^\s]+)/g;

    let urls = text.match(urlRegex)
    console.log(urls)

    urls.forEach((e) => {
        if (e.includes('continuous-testing/')) {
            console.log("Finally found: " + e)
        }
    })

}


