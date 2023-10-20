import { google } from "googleapis";
import { createInterface } from "readline";
import { TOKEN_PATH } from "./constants";
import * as open from "open";
import { writeFile } from "fs/promises";

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRECT,
  "http://localhost"
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});
open.default(authUrl);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the code from the web page: ", async (code) => {
  rl.close();
  const getToken = (code: string) => {
    return new Promise((resolve, reject) => {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("Error retrieving access token", err);
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  };

  try {
    const token = await getToken(code);
    await writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log(`Token stored to '${TOKEN_PATH}'`);
  } catch (err) {
    console.error("Error storing token", err);
  }
});
