import { TriggerClient } from "@trigger.dev/sdk";
import { parse } from "url";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// Documentation
// https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/activity-log-alerts-webhook
// https://learn.microsoft.com/en-us/azure/service-health/service-health-alert-webhook-guide

// Steps
// Goto Azure Monitor > Alerts > Create Action Group
// Fill up Basics with any data. In Actions, select Webhook and add the trigger endpoint with secret query param. Example: https://<Endpoint>?secret=123 then review and create.
// Goto Alerts Action groups and select the action group you created and click on the text action group. Select any sample type and test.

// Create an HTTP Endpoint, with the azure details
const azure = client.defineHttpEndpoint({
  id: "azure.com",
  title: "azure",
  source: "azure.com",
  icon: "azure",
  verify: async (request) => {
    const { query } = parse(request.url, true);
    if (query.secret === process.env.AZURE_WEBHOOK_SECRET) {
      return { success: true };
    }
    return { success: false, message: "Verification failed" };
  },
});

// A job that runs when the HTTP endpoint is called from Azure Monitoring Alerts
client.defineJob({
  id: "http-azure",
  name: "HTTP Azure",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: azure.onRequest(),
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
