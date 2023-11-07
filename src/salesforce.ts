import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";
import jsforce from "jsforce";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Create a Salesforce account: https://developer.salesforce.com/signup
// jsforce SDK: https://developer.salesforce.com/docs/platform/functions/guide/develop.html#use-salesforce-apis
// Salesforce only provides API access for the following editions: Enterprise,  Unlimited, Developer or Performance Editions
// Salesforce connection instance
const conn = new jsforce.Connection({
  loginUrl: process.env.SF_LOGIN_URL,
});

// Salesforce login
conn.login(
  process.env.SF_USERNAME!,
  process.env.SF_PASSWORD! + process.env.SF_TOKEN!, // Get your token from https://help.salesforce.com/articleView?id=user_security_token.htm&type=5
  (error, userInfo) => {
    if (error) {
      return console.error(error);
    } else {
      console.log("Salesforce login successful. User ID: " + userInfo.id);
    }
  }
);

client.defineJob({
  id: "salesforce-create-contact",
  name: "Salesforce create contact",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "salesforce-create-contact",
    schema: z.object({
      Name: z.string(),
      Website: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { Name, Website } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Salesforce create contact",
      async () => {
        // Create a new record in Salesforce
        await conn.sobject("Account").create({ Name, Website }, (err, ret) => {
          if (err || !ret.success) {
            return console.error(err, ret);
          }
          console.log("Created record id : " + ret.id);
        });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Salesforce create contact", icon: "salesforce" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
