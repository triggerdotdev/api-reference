import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Docs: https://developers.google.com/drive/api/guides/push

// Create a channel to receive notifications from google drive API
// By making a POST request to https://www.googleapis.com/drive/v3/files/fileId/watch endpoint (replace fileId with your file id)
// With authorization header and body as:
// ID is a unique string, which will be used to identify the channel
// Type is web_hook
// Address is the endpoint URL, where the notifications will be sent
// Token is a Secret string, which will be used to verify the request
// Get endpoint URL and Secret from the `trigger.dev` dashboard

// Set the GOOGLE_DRIVE_CHANNEL_TOKEN (Secret) in the .env file.

// Create an HTTP Endpoint, with the Google Drive details
export const drive = client.defineHttpEndpoint({
  id: "google-drive",
  title: "Google Drive",
  source: "drive.google.com",
  icon: "googledrive",
  respondWith: {
    skipTriggeringRuns: true,
    filter: {
      headers: {
        "x-goog-resource-state": [{ $startsWith: "sync" }],
      },
    },
    handler: async (req, verify) => {
      return new Response("OK", { status: 200 });
    },
  },
  verify: async (request) => {
    if (
      request.headers.get("x-goog-channel-token") ===
      process.env.GOOGLE_DRIVE_CHANNEL_TOKEN
    ) {
      return { success: true };
    }

    return {
      success: false,
      reason: "Invalid token",
    };
  },
});

client.defineJob({
  id: "http-google-drive",
  name: "HTTP Google Drive",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: drive.onRequest(),
  run: async (request, io, ctx) => {
    await io.logger.info(`Body`, {
      resourceId: request.headers.get("x-goog-resource-id"),
      resourceUri: request.headers.get("x-goog-resource-uri"),
      resourceState: request.headers.get("x-goog-resource-state"),
    });
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
// end-hide-code
