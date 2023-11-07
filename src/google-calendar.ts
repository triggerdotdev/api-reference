import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import z from "zod";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create a service account and project: https://cloud.google.com/iam/docs/service-account-overview
// Create a JWT (JSON Web Token) authentication instance for Google APIs.
// https://cloud.google.com/nodejs/docs/reference/google-auth-library/latest/google-auth-library/jwt
// Make sure to add the service account email to the calendar you want to access as "Make changes to manage" https://support.google.com/calendar/answer/37082?hl=en
const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL, // The email associated with the service account
  key: process.env.GOOGLE_PRIVATE_KEY!.split(String.raw`\n`).join("\n"), // The private key associated with the service account
  scopes: ["https://www.googleapis.com/auth/calendar"], // The desired scope for accessing Google Calendar
});

// Initialize the Google Calendar API
// You have to enable the Google Calendar API https://console.cloud.google.com/apis/
const calendar = google.calendar({ version: "v3", auth });

client.defineJob({
  id: "google-calendar-event-create",
  name: "Google Calendar Event Create",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "google-calendar",
    schema: z.object({
      calendarId: z.string(), // The calendar ID is in the Integrate Calendar section of the calendar settings
      summary: z.string(),
      description: z.string().optional(),
      start: z.string(), // Format as ISO 8601 datetime string. Ex: "2021-08-01T12:00:00.000Z"
      end: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { calendarId, summary, description, start, end } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Google Calendar create event",
      async () => {
        const requestBody = {
          summary,
          description,
          start: {
            dateTime: start,
            timeZone: "UTC", // Adjust to the desired time zone
          },
          end: {
            dateTime: end,
            timeZone: "UTC",
          },
        };

        await calendar.events.insert({ calendarId, requestBody });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Google Calendar create event", icon: "calendar" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
