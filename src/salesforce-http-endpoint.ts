import { TriggerClient, verifyRequestSignature } from '@trigger.dev/sdk';

// hide-code
const client = new TriggerClient({ id: 'api-reference' });
// end-hide-code

//create an HTTP Endpoint, with the Salesforce details
const salesforce = client.defineHttpEndpoint({
  id: 'salesforce',
  source: 'salesforce.com',
  icon: 'salesforce',
  verify: async request => {
    return await verifyRequestSignature({
      request,
      headerName: 'X-SF-Signature-256',
      secret: process.env.SF_WEBHOOK_SIGNING_SECRET!,
      algorithm: 'sha256',
    });
  },
});

client.defineJob({
  id: 'http-salesforce',
  name: 'HTTP salesforce',
  version: '1.0.0',
  enabled: true,
  //create a trigger from the HTTP endpoint
  trigger: salesforce.onRequest(),
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
