import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Apps Script Docs: https://developers.google.com/apps-script/reference
// Triggers Docs: https://developers.google.com/apps-script/guides/triggers

// Go to https://docs.google.com/document
// Open a document or create a new one
// Click on Extensions > Apps Script

// Add the following code to the script editor:

// function pushNotification(e) {
//   // get endpoint url and secret key from trigger.dev dashboard
//   var url = ''
//   var secretKey = ''

//   var payloadData = {
//     'message': 'Google Docs event',
//     'details': e // This contains information about the edit event
//   };

//   var payload = JSON.stringify(payloadData);

//   var options = {
//     'method': 'post',
//     'contentType': 'application/json',
//     'headers': {
//       'x-webhook-secret': secretKey
//     },
//     'payload': payload
//   };

//   UrlFetchApp.fetch(url, options);
// }

// Save the script and click on the clock icon (Triggers) in the sidebar to open the Triggers page
// Click on Add Trigger, which will open a dialog box
// Choose pushNotification as the function to run
// Select event type, by default it is set to On open
// Click Save

// Set the GOOGLE_DOCS_WEBHOOK_SECRET (Secret) in the .env file.

// Create an HTTP Endpoint, with the Google Docs details
const docs = client.defineHttpEndpoint({
  id: "google-docs",
  source: "google-docs",
  icon: "googledocs",
  verify: async (request) => {
    const secret = process.env.GOOGLE_DOCS_WEBHOOK_SECRET;
    if (!secret) return { success: false, reason: "Missing Secret" };
    if (request.headers.get("x-webhook-secret") === secret)
      return { success: true };
    return { success: false, reason: "Webhook Secret Match Failed" };
  },
});

client.defineJob({
  id: "http-google-docs",
  name: "HTTP Google Docs",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: docs.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
