const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const async = require('async'); 
const { file } = require('googleapis/build/src/apis/file');

// Implementing rate limiting with the aim to match the 1000 requests per 100000  
// milliseconds limit on the free API quota. >> I will be using 8 requests per 1000 milliseconds here. <<
// Please lower down the limit further if you encounter errors.
const RateLimiter = require('limiter').RateLimiter;
const limiter = new RateLimiter(8, 1000);

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const ERRORS_PATH = 'errors.log';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
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
function getAccessToken(oAuth2Client, callback) {
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
 * Lists the names and IDs of all files, and deletes them by their ID.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  /* The maximum page size we can get from the method drive.files.list() is 1000
  * Therefore, we have to list multiple times to delete all files. We will
  * loop using the method async.forever() for this purpose.
  */
  var err_count = 0;  // Count of errors in the current run
  var filesWithError = [];  
  async.forever((next) => {
    drive.files.list({
        pageSize: 1000,
        fields: 'nextPageToken, files(id, name, ownedByMe, shared)',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            var deletedFilesCount = 0;
          files.map((file) => {
              if(file.ownedByMe || !file.shared) {
                limiter.removeTokens(1, function() {
                    if(!filesWithError.indexOf(file.id) > -1) {  // Skip the file that already gave error.
                        drive.files.delete({
                            'fileId': file.id
                            }).then(() => {
                                deletedFilesCount += 1;
                                console.log('File ', file.name, 'is deleted.');
                            }).catch((err) => {
                                fs.appendFile(ERRORS_PATH, "Error: " + JSON.stringify(err.response.data.error) + ' with file name: ' + file.name + '\n', (err) => {
                                    if (err) return console.error(err);
                                });
                                filesWithError.push(file.id);  // Noting down the files that gave errors.
                                err_count += 1;
                            });
                    }
                });
              }
            });
            if(filesWithError.length >= files.length || deletedFilesCount == 0) {
                next('No more files can be deleted.')
            } else {
                next();
            }
        } else {
          next('No files found or everything has been deleted.');
        }
    });
  }).catch((msg) => {
      console.log(msg)
  });
  if(err_count) {
      console.log('There were ', err_count, ' errors encountered while deleting the files. Please refer ' + ERRORS_PATH +' for more details');
  }
}