import { config } from "dotenv";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import z from "zod";

// Configure dotenv to override existing environment variables with values from the .env file.
config({ override: true });

// Create a JWT (JSON Web Token) authentication instance for Google APIs.
const auth = new JWT({
  email: process.env.CLIENT_EMAIL, // The email associated with the service account
  key: process.env.PRIVATE_KEY!.replace(/\\n/gm, "\n"), // The private key associated with the service account
  scopes: "https://www.googleapis.com/auth/spreadsheets", // The desired scope for accessing Google Sheets
});

const client = new TriggerClient({
  id: "api-reference",
  apiKey: process.env.TRIGGER_API_KEY,
});

// Initialize the Google Sheets API
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
    }),
  }),
  run: async (payload, io, ctx) => {
    const { fullName, githubUrl } = payload;

    //wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Google Sheets append row",
      async () => {
        const sheetsData = [[fullName, githubUrl]];

        const sheetsAPI = sheets.spreadsheets.values;

        await sheetsAPI.append({
          spreadsheetId: process.env.SPREADSHEET_ID,
          range: process.env.SPREADSHEET_RANGE,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: sheetsData,
          },
        });
      },
      //you can add metadata to the task to improve the display in the logs
      { name: "Google Sheets append", icon: "google" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
