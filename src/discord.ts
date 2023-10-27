import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { GatewayIntentBits, Client } from "@discordjs/core";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// SDK: https://discord.js.org/docs/packages/core/1.0.1
// Get the Discord bot token follow the instructions here:
// https://discord.com/developers/docs/getting-started
// Bot need to be added to a server to be able to send messages.
// Oauth URL generator to add the bot to a server. Scopes: bot, send messages
// Create REST and WebSocket managers directly
const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN!
);

// Create a gateway to receive events
const gateway = new WebSocketManager({
  token: process.env.DISCORD_BOT_TOKEN!,
  intents: GatewayIntentBits.MessageContent,
  rest,
});

// Create a client to emit relevant events.
const discordClient = new Client({ rest, gateway });

client.defineJob({
  id: "discord-send-message",
  name: "Discord send message",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "discord-send-message",
    schema: z.object({
      channelId: z.string(), // To get the channel id, right click on the channel and click "Copy ID". You need to enable developer mode in Discord settings.
      content: z.string(), // The message content
    }),
  }),
  run: async (payload, io, ctx) => {
    const { channelId, content } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Discord send message",
      async () => {
        // See more https://discord.js.org/docs/packages/core/1.0.1/ChannelsAPI:Class
        const channelsAPI = discordClient.api.channels;
        await channelsAPI.createMessage(channelId, { content });
      },

      // Add metadata to the task to improve the display in the logs
      { name: "Discord send message", icon: "discord" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
