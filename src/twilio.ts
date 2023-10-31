import twilio from "twilio";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// Initialize the Twilio instance
// Twilio SDK https://github.com/twilio/twilio-node
// Your AccountSID and Auth Token from console.twilio.com
// https://www.twilio.com/docs/sms/quickstart/node
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

client.defineJob({
  id: "twilio-send-message",
  name: "Twilio send message",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "twilio-send-message",
    schema: z.object({
      // 'from' is Your Twilio phone number.
      // Adding 'whatsapp:' before the number will send a WhatsApp message.
      // https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
      from: z.string(),
      to: z.string(), // The phone number you want to send the message.
      body: z.string(), // The message body
    }),
  }),
  run: async (payload, io, ctx) => {
    const { from, to, body } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Twilio send message",
      async () => {
        await twilioClient.messages.create({ from, to, body });
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Twilio send message", icon: "twilio" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
