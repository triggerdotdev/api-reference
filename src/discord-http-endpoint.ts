import nacl from 'tweetnacl'
import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

const discord = client.defineHttpEndpoint({
    id: "discord",
    source: "discord.com",
    icon: "discord",
    verify: async (request) => {
        const body = await request.text();
        const signature = request.headers.get('x-signature-ed25519')
        const timestamp = request.headers.get('x-signature-timestamp')
        const discordKey = process.env.DISCORD_APPLICATION_KEY
        if (!discordKey) return { success: false, reason: 'Missing discord public key' }
        if (!signature || !timestamp) return { success: false, reason: 'Missing discord headers' }
        const success = nacl.sign.detached.verify(
            Buffer.from(timestamp + body),
            Buffer.from(signature, "hex"),
            Buffer.from(discordKey, "hex")
        );
        if (success) return { success };
        return { success: false, reason: "Failed ed25519 verification" };
    },
});

// Job that runs when the HTTP endpoint is called from Discord
client.defineJob({
    id: "http-discord",
    name: "HTTP Discord",
    version: "1.0.0",
    enabled: true,
    // Create a trigger from the HTTP endpoint
    trigger: discord.onRequest(),
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
