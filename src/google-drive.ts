import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import z from "zod";

const client = new TriggerClient({
  id: "api-reference",
});

// Create a service account and project: https://cloud.google.com/iam/docs/service-account-overview
// Create a JWT (JSON Web Token) authentication instance for Google APIs.
// https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/jwt
const auth = new JWT({
  email: process.env.CLIENT_EMAIL, // The email associated with the service account
  key: process.env.PRIVATE_KEY!.split(String.raw`\n`).join("\n"), // The private key associated with the service account
  scopes: "https://www.googleapis.com/auth/drive", // The desired scope for accessing Google Drive
});

// Initialize the Google Drive API
// You have to enable the Google Drive API https://console.cloud.google.com/apis/
const drive = google.drive({ version: "v2", auth });

client.defineJob({
  id: "google-drive-file-rename",
  name: "Google drive file rename",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "google-drive-file-rename",
    schema: z.object({
      fileId: z.string(), // The fileId is a unique identifier found in the Google Drive sharing link. Example: https://drive.google.com/file/d/FILE_ID/view
      newName: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { fileId, newName } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Google Drive File Rename",
      async () => {
        
        // Important Note: Don't forget to share the Google Drive file with the service account email for this code to work.
        await drive.files.update({
          fileId,
          requestBody: {
            title: newName,
          },
        });
      },

      // Add metadata to the task to improve the display in the logs
      { name: "Google drive file rename", icon: "google" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
