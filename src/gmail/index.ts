import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { google } from "googleapis";
import { TOKEN_PATH } from "./constants";
import fs from "fs";
import z from "zod";

const client = new TriggerClient({
  id: "api-reference",
});

// Create a OAuth2 for Node.js: https://developers.google.com/gmail/api/quickstart/nodejs
// Create a OAuth2 authentication instance for Google APIs.
// https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/oauth2client
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRECT
);

client.defineJob({
  id: "send-gmail",
  name: "Send Gmail",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "send-gmail",
    schema: z.object({
      to: z.string(),
      subject: z.string(),
      message: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { to, subject, message } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Send Gmail",
      async () => {
        // Check if we have stored credentials
        if (!fs.existsSync(TOKEN_PATH)) {
          console.log("Authentication required. Run 'npm run gmail-authorize'");
          return;
        }

        // Load stored credentials
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
        oAuth2Client.setCredentials(token);

        // Create a Gmail API instance
        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

        // Create the email message
        const email = `To: ${to}\r\nSubject: ${subject}\r\n\r\n${message}`;

        // Send the email
        const res = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: Buffer.from(email).toString("base64"),
          },
        });

        console.log("Message sent: ", res.data);
      },
      { name: "Send Gmail", icon: "google" }
    );
  },
});

import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
