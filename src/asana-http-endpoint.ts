import { TriggerClient, verifyRequestSignature } from '@trigger.dev/sdk';

const ASANA_SECRET_KEY = 'ASANA_SECRET';

// hide-code
const client = new TriggerClient({ id: 'api-reference' });
// end-hide-code

// Create an HTTP endpoint to listen to Asana webhooks.
// (This will create the endpoint URL on the `trigger.dev` dashboard)
// Create a Asana webhook by providing the endpoint URL and interested resources/events.
// (use https://developers.asana.com/reference/createwebhook)
const asana = client.defineHttpEndpoint({
  id: 'asana',
  source: 'asana.com',
  icon: 'asana',
  // This is needed for the initial webhook handshake.
  // https://developers.asana.com/docs/webhooks-guide#the-webhook-handshake
  respondWith: {
    skipTriggeringRuns: true,
    filter: {
      method: ['POST'],
      headers: {
        'x-hook-secret': [{ $startsWith: '' }],
      },
    },
    handler: async (req, verify) => {
      const secret = req.headers.get('x-hook-secret');

      if (!secret) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Asana sends the Secret (used to sign webhooks) as part of the initial handshake.
      // This is persisted in a KV store on `trigger.dev` (can be retrieved later).
      await client.store.env.set(ASANA_SECRET_KEY, secret);

      return new Response(undefined, {
        status: 204,
        headers: {
          'x-hook-secret': secret,
        },
      });
    },
  },
  verify: async request => {
    // Retrive the stored Secret from KV store.
    const secret = await client.store.env.get<string>(ASANA_SECRET_KEY);

    if (!secret) {
      return { success: false, reason: 'secret not found' };
    }

    return await verifyRequestSignature({
      request,
      headerName: 'X-Hook-Signature',
      secret,
      algorithm: 'sha256',
    });
  },
});

client.defineJob({
  id: 'http-asana',
  name: 'HTTP Asana',
  version: '1.0.0',
  enabled: true,
  //create a trigger from the HTTP endpoint
  trigger: asana.onRequest(),
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
