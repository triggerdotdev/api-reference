import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
const formData = require("form-data");
const Mailgun = require("mailgun.js");

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// https://documentation.mailgun.com/en/latest/quickstart-sending.html#how-to-start-sending-emaild
// after login from https://app.mailgun.com/mg/dashboard -> setting you can get api, and private_api_key
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: process.env.MAILGUN_API_KEY_ID,
  key: process.env.MAILGUN_PRIVATE_API_KEY,
});

client.defineJob({
  id: "mailgun-send-email",
  name: "Mailgun send email",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "mailgun.send.email",
    schema: z.object({
      sandboxDomain: z.string(), // for sandboxdomain -> https://app.mailgun.com/mg/dashboard
      emailTo: z.string().email(),
      subject: z.string(), // email subject
      text: z.string(), // email content
    }),
  }),

  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    const user = await io.runTask(
      "Send Email",
      async () => {
        return await mg.messages.create(payload.sandboxDomain, {
          from: `Mailgun Sandbox <postmaster@${payload.sandboxDomain}>`,
          to: [payload.emailTo],
          subject: payload.subject,
          text: payload.text,
        });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Send Email by Mailgun", icon: "mailgun" }
    );
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
