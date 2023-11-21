import { TriggerClient } from "@trigger.dev/sdk";
import { Webhook, WebhookVerificationError } from "svix";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

export const clerk = client.defineHttpEndpoint({
  id: "clerk.com",
  title: "Clerk",
  source: "clerk.com",
  icon: "clerk",
  verify: async (
    request: Request
  ): Promise<{ success: boolean; reason?: string }> => {
    const body = await request.text();
    const svixId = request.headers.get("svix-id") ?? "";
    const svixIdTimeStamp = request.headers.get("svix-timestamp") ?? "";
    const svixSignature = request.headers.get("svix-signature") ?? "";

    if (!svixId || !svixIdTimeStamp || !svixSignature) {
      return {
        success: false,
        reason: "Missing svix headers",
      };
    }

    const svixHeaders = {
      "svix-id": svixId,
      "svix-timestamp": svixIdTimeStamp,
      "svix-signature": svixSignature,
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET as string);

    type WebhookEvent = string;

    try {
      wh.verify(body, svixHeaders) as WebhookEvent;

      return {
        success: true,
      };
    } catch (err: unknown) {
      console.log(`❌ Error message: ${(err as Error).message}`);

      if (err instanceof WebhookVerificationError) {
        return {
          success: false,
          reason: err.message,
        };
      }

      return {
        success: false,
        reason: "Unknown error",
      };
    }
  },
});

// Job that runs when the HTTP endpoint is called from Clerk
// When a contact is created or deleted
client.defineJob({
  id: "http-clerk",
  name: "HTTP Clerk",
  version: "1.0.0",
  enabled: true,
  // Create a trigger from the HTTP endpoint
  trigger: clerk.onRequest(),
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
