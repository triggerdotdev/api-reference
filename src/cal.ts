import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";

const client = new TriggerClient({ id: "api-reference" });

// API reference: https://cal.com/docs/enterprise-features/api/api-reference/
// If you get the error 'An error occurred while querying the database', this may because you have linked calendars in your account.
// This is a known Cal.com issue. Please reach out to us on Discord if you are having issues.
client.defineJob({
  id: "cal-dot-com-find-all-bookings",
  name: "Cal.com find all bookings",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "cal.com.find.bookings",
  }),
  run: async (payload, io, ctx) => {
    // Wrap any Cal.com API call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Find all bookings",
      async () => {
        const url = `https://api.cal.com/v1/bookings?apiKey=${process.env.CAL_API_KEY}`;
        const response = await fetch(url);

        return response.json();
      },
      { name: "Find all bookings", icon: "cal" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
