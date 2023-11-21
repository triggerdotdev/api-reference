import { TriggerClient } from "@trigger.dev/sdk";
import { createHash } from "crypto";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

//Go to your normal hubspot.com account
//Create private app in Settings > integrations > private apps
//With scopes: crm.objects.contacts.read, crm.objects.contacts.write
//And add your trigger webhooks url in target url.
//Create subscription for contact creation and deletion
//Client secret from Auth tab

//create an HTTP Endpoint, with the hubspot.com details
const hubspotdotcom = client.defineHttpEndpoint({
  id: "hubspot.com",
  source: "hubspot.com",
  icon: "hubspotdotcom",
  verify: async (request) => {
    const bodyText = await request.text();
    const source_string = process.env.HUBSPOTDOTCOM_SECRET! + bodyText;
    const hash = createHash("sha256").update(source_string).digest("hex");
    const reqHash = request.headers.get("X-HubSpot-Signature");
    const success = hash === reqHash;
    if (success) return { success };
    return { success: false, reason: "Failed sha256 verification" };
  },
});

//Job that runs when the HTTP endpoint is called from hubspot.com Create or delete contact
client.defineJob({
  id: "http-hubspotdotcom",
  name: "HTTP HubSpot.com",
  version: "1.0.0",
  enabled: true,
  //create a trigger from the HTTP endpoint
  trigger: hubspotdotcom.onRequest(),
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
