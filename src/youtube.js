const fs = require('fs');
// const readline = require('readline');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const http = require("http");
const { exec } = require('child_process');

const host = 'localhost';
const port = 3037;

// -------------------- YOUTUBE CONFIG --------------------
const _ChannelID = "UC4CK90nHSx-CjkWA6CTM1ZA"


// -------------------- END YT CONFIG --------------------


const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
const TOKEN_PATH = './src/auth/' + 'client_oauth_token.json';

module.exports = async (videoPath, title, description, tags) => {
    openURL("https://studio.youtube.com/channel/UC4CK90nHSx-CjkWA6CTM1ZA/videos/short")
    return
    if (!fs.existsSync(videoPath)) throw new Error("Video from videoPath doesnt exist in upload video script.")

    return new Promise((res, rej) => {
        fs.readFile('./src/auth/client_secret.json', function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return rej(err);
            }
            // Authorize a client with the loaded credentials, then call the YouTube API.
            authorize(JSON.parse(content), (auth) => uploadVideo(res, auth, videoPath, title, description, tags));
        });
    })
    // Load client secrets from a local file.
}

/**
 * Upload the video file.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function uploadVideo(res, auth, videoPath, title, description, tags) {
    const service = google.youtube('v3')

    service.videos.insert({
        auth: auth,
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title,
                description,
                tags,
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en'
            },
            status: {
                privacyStatus: "private"
            },
        },
        media: {
            body: fs.createReadStream(videoPath),
        },
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        // console.log(response.data)
        res(response.data)
        openURL(`https://studio.youtube.com/channel/${_ChannelID}/videos/short`)
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const clientSecret = credentials.web.client_secret;
    const clientId = credentials.web.client_id;
    const redirectUrl = credentials.web.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function (err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}


function openURL(path) {
    // Determine the command based on the operating system
    const command = process.platform === 'win32' ? `start "" "${path}"` : `open "${path}"`;

    // Execute the command
    exec(command, (error) => {
        if (error) {
            console.error(`Error opening URL: ${error}`);
            return;
        }

        console.log(path + ' opened in default browser');
    });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    const requestListener = function (req, res) {
        // if (req.url !== "/auth") return
        var q = require('url').parse(req.url, true);
        let code = q.query['code']
        if (q.pathname !== "/auth" || !code) return res.end("Invalid!")
        // let code = ""
        oauth2Client.getToken(code, function (err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                res.end("Error!")
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
            res.end("Code Accepted!" + code)
        });
        server.close()
    };

    const server = http.createServer(requestListener);
    server.listen(port, host, () => {
        console.log(`Temp server is running on http://${host}:${port}`);
        openURL(authUrl)
    });

}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('New Youtube Token stored to ' + TOKEN_PATH);
    });
}