import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// NB: This job only works if you have a Google Workspace account

// Create a service account and project: https://cloud.google.com/iam/docs/service-account-overview
// Create a JWT (JSON Web Token) authentication instance for Google APIs.
// https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/jwt
const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL, // The email associated with the service account
  key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join("\n"), // The private key associated with the service account
  scopes: ["https://www.googleapis.com/auth/gmail.send"], // The desired scope for sending Gmail messages
});

// In order to send an email from a user's account, you must enable Gmail API Domain-Wide Delegation of Authority:
// 1. Google Admin Console: Go to your Google Admin Console.
// 2. Security Settings: Navigate to Security > API controls.
// 3. Manage Domain-Wide Delegation: In the "Domain wide delegation" panel, click on "Manage Domain-Wide Delegation".
// 4. Add Service Account: Click on "Add new" and provide:
//  4a. Client ID: This is the Service Account's Client ID, which can be found in your Google Cloud Console under the Service Account's details.
//  4b. OAuth Scopes: Enter https://www.googleapis.com/auth/gmail.send to grant send permissions via Gmail.
// 5. Click on "Authorize".

// Replace with the email of the user you're impersonating (the user that will send the email)
auth.subject = process.env.GOOGLE_IMPERSONATION_EMAIL;

// Initialize the Gmail API
const gmail = google.gmail({ version: "v1", auth });

client.defineJob({
  id: "send-gmail-email",
  name: "Send an email from Gmail",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "send-gmail-email",
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

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
