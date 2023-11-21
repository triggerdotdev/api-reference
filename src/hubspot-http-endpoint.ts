import { TriggerClient } from "@trigger.dev/sdk";
import { createHash } from "crypto";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Go to your normal HubSpot account
// Create a private app in Settings > Integrations > Private apps
// With scopes: 'crm.objects.contacts.read', 'crm.objects.contacts.write'
// And add your trigger webhooks url in target url.
// Create subscription for contact creation and deletion
// Copy your client secret from the Auth tab and paste it in the .env file
// Create an HTTP Endpoint, with the HubSpot details
const hubspot = client.defineHttpEndpoint({
  id: "hubspot",
  source: "hubspot.com",
  icon: "hubspot",
  verify: async (request) => {
    const bodyText = await request.text();
    const source_string = process.env.HUBSPOT_SECRET! + bodyText;
    const hash = createHash("sha256").update(source_string).digest("hex");
    const reqHash = request.headers.get("X-HubSpot-Signature");
    const success = hash === reqHash;
    if (success) return { success };
    return { success: false, reason: "Failed sha256 verification" };
  },
});

// Job that runs when the HTTP endpoint is called from HubSpot
// When a contact is created or deleted
client.defineJob({
  id: "http-hubspot",
  name: "HTTP HubSpot",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: hubspot.onRequest(),
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
