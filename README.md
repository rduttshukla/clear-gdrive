# clear-gdrive
Node.js script that deletes **ALL OF THE** files from your Google Drive. Useful if you have thousands or millions of files in your Google Drive and you want to delete them at once. I needed to delete lots of files in my GSuite Google Drive, so I thought doing so with Google Drive API would be a good idea.

# Install and Run ⚙

1. Install Node.js and npm into your computer.
2. Install the dependencies by `npm install`.
3. Go to Google Drive API's [Node.js Quickstart](https://developers.google.com/drive/api/v3/quickstart/nodejs#step_1_turn_on_the) and click on "Enable the Drive API" button and follow the instructions.
4. When asked, choose "Desktop app" and download the resulting `credentials.json` file to the project root directory.

**WARNING: PERFORMING THE NEXT STEP WILL DELETE ALL OF YOUR FILES ON YOUR GOOGLE DRIVE.** ⚠⚠

5. Run the script by running `node .` in the project root directory. **The initial version does not have any confirmation and it will start deleting files right away. Press `Ctrl + C` or `Cmd + C` to stop deletion of files at any time.**

# Disclaimer ‼
There's a reason why Google does not provide deleting all files option. Read their response [here](https://support.google.com/drive/thread/5104011?hl=en&msgid=5146445). I will not be responsible for any files that you accidently delete through the use of this script. You are deleting the files because you don't need them. If you delete any important file by mistake, good luck contacting Google in getting your files recovered.
