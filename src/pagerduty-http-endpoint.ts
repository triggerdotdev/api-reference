import crypto from 'crypto';
import { TriggerClient } from '@trigger.dev/sdk';

// hide-code
const client = new TriggerClient({ id: 'api-reference' });
// end-hide-code

// Create an HTTP endpoint to listen to PagerDuty webhooks.
// (This will create the endpoint URL on the `trigger.dev` dashboard)
// Create a PagerDuty account (if you don't have one).
// Go to Integrations -> Generic Webhooks and setup the subscription.
// Copy the secret shown in popup to PAGERDUTY_WEBHOOK_SIGNING_SECRET in the .env file.
const pagerduty = client.defineHttpEndpoint({
  id: 'pagerduty',
  source: 'pagerduty.com',
  icon: 'pagerduty',
  verify: async (request) => {
    const bodyText = await request.text();
    const signatures = request.headers.get('X-PagerDuty-Signature');
    if (!signatures) {
        return { success: false };
    }
    const signature = crypto
      .createHmac('sha256', process.env.PAGERDUTY_WEBHOOK_SIGNING_SECRET!)
      .update(bodyText)
      .digest('hex');
    const signatureWithVersion = "v1=" + signature;
    const signatureList = signatures.split(",");
    return {
        success: signatureList.indexOf(signatureWithVersion) > -1
    };
  },
});

client.defineJob({
  id: 'http-pagerduty',
  name: 'HTTP PagerDuty',
  version: '1.0.0',
  enabled: true,
  trigger: pagerduty.onRequest(),
  run: async (request, io, ctx) => {
    const body = await request.json();
    await io.logger.info(`Body`, body);
  },
});

// hide-code
// These lines can be removed if you don't want to use express
import { createExpressServer } from '@trigger.dev/express';
createExpressServer(client);
// end-hide-code
