import { config } from "dotenv";
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
  email: process.env.GOOGLE_CLIENT_EMAIL, // The email associated with the service account
  key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join("\n"), // The private key associated with the service account
  scopes: "https://www.googleapis.com/auth/spreadsheets", // The desired scope for accessing Google Sheets
});

// You have to enable the Google Sheets API: https://console.cloud.google.com/apis/
const sheets = google.sheets({ version: "v4", auth });

client.defineJob({
  id: "google-sheets-append",
  name: "Google Sheets Append",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "google-sheets",
    schema: z.object({
      fullName: z.string(),
      githubUrl: z.string(),
      range: z.string().optional(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { fullName, githubUrl, range } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Google Sheets append row",
      async () => {
        const sheetsData = [[fullName, githubUrl]];

        const sheetsAPI = sheets.spreadsheets.values;

        await sheetsAPI.append({
          // NB: You must share your Google Sheet with your service account email
          spreadsheetId: process.env.SPREADSHEET_ID,
          // Set a spreadsheet range
          range: range,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: sheetsData,
          },
        });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Google Sheets append", icon: "google" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
