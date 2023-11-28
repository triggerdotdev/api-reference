import { TriggerClient, verifyRequestSignature } from '@trigger.dev/sdk';

// hide-code
const client = new TriggerClient({ id: 'api-reference' });
// end-hide-code

// Create an HTTP endpoint to listen to Instagram webhooks
// (This will create the endpoint URL on the `trigger.dev` dashboard)
// Create a Meta developer account (if you don't have one).
// Create an app on the Meta developer platform.
// Copy the `App Secret` from Dashboard > App Settings > Basic.
// Go to Dashboard > Webhooks and setup the subscriptions.
// Provide the Webhook URL and Verification Token (random string).
// Set the `INSTAGRAM_WEBHOOK_SIGNING_SECRET` (App Secret) and `INSTAGRAM_VERIFICATION_TOKEN` (Verification Token) in the .env file.
const instagram = client.defineHttpEndpoint({
  id: 'instagram',
  source: 'instagram.com',
  icon: 'instagram',
  // This is only needed for certain APIs like WhatsApp, Instagram which don't setup the webhook until you pass the test
  respondWith: {
    // Don't trigger runs if they match this filter
    skipTriggeringRuns: true,
    filter: {
      method: ['GET'],
      query: {
        'hub.mode': [{ $ignoreCaseEquals: 'subscribe' }],
      },
    },
    // Handler for the webhook setup test
    handler: async (request, verify) => {
      const searchParams = new URL(request.url).searchParams;
      if (
        searchParams.get('hub.verify_token') !==
        process.env.INSTAGRAM_VERIFICATION_TOKEN
      ) {
        return new Response('Unauthorized', { status: 401 });
      }
      return new Response(searchParams.get('hub.challenge') ?? 'OK', {
        status: 200,
      });
    },
  },
  verify: async request => {
    return await verifyRequestSignature({
      request,
      headerName: 'x-hub-signature-256',
      secret: process.env.INSTAGRAM_WEBHOOK_SIGNING_SECRET!,
      algorithm: 'sha256',
    });
  },
});

client.defineJob({
  id: 'http-instagram',
  name: 'HTTP Instagram',
  version: '1.0.0',
  enabled: true,
  trigger: instagram.onRequest(),
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
