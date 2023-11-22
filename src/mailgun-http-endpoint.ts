import { TriggerClient } from "@trigger.dev/sdk";
import { createHmac } from "crypto";

// hide-code
const client = new TriggerClient({ id: "api-reference", apiKey: process.env.TRIGGER_API_KEY! });
// end-hide-code

//Go to your normal mailgun.com account
//Create private app in Sending > Webhooks
//With scope: Delivered
//And add your trigger webhooks url in target url
//Obtain the Webhook Key on the right of your window

//create an HTTP Endpoint, with the hubspot.com details
const mailgundotcom = client.defineHttpEndpoint({
    id: "mailgun.com",
    source: "mailgun.com",
    icon: "mailgun.com",
    verify: async (request) => {
        const body = await request.json();
        const hash = createHmac('sha256', process.env.MAILGUN_WEBHOOK_SIGNING_KEY!)
            .update(body.signature.timestamp + body.signature.token)
            .digest('hex')
        const reqHash = body.signature.signature;
        const success = hash === reqHash;
        if (success) return { success };
        return { success: false, reason: "Failed sha256 verification" };
    },
});

//Job that runs when the HTTP endpoint is called from hubspot.com Create or delete contact
client.defineJob({
    id: "http-mailgundotcom",
    name: "HTTP Mailgun.com",
    version: "1.0.0",
    enabled: true,
    //create a trigger from the HTTP endpoint
    trigger: mailgundotcom.onRequest(),
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
