// digitalOcean.ts
import { TriggerClient, eventTrigger } from '@trigger.dev/sdk';
import { z } from 'zod';
import DigitalOcean from "node-digitalocean";

const client = new TriggerClient({ id: "api-reference" });

// Initialize DigitalOcean client
const digitalOceanClient = new DigitalOcean(process.env.DO_TOKEN?? "");

client.defineJob({
  id: "digitalOcean-deployDroplet",
  name: "Deploy Droplet from a Master Snapshot",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "digitalOcean.deployDroplet",
    schema: z.object({
      snapshotId: z.string(),
      dropletName: z.string(),
      region: z.string(),
      size: z.string(),
    }),
  }),

run: async (payload, io, ctx) => {
    // Wrap any SDK call in io.runTask so it's resumable and displays in logs
    return io.runTask(
        "Deploy Droplet",
        async () => {
            const droplet = await digitalOceanClient.droplets.create({
                name: payload.dropletName,
                region: payload.region,
                size: payload.size,
                image: payload.snapshotId,
                ssh_keys: [], // add any additional properties here
                backups: false,
                ipv6: false,
                user_data: null,
                private_networking: false,
                volumes: [],
                monitoring: false,
                tags: [],
            });

            return droplet;
        },
        // You can add metadata to the task to improve the display in the logs
        { name: "DigitalOcean Deploy Droplet", icon: "digitalOcean" }
    );
},
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from '@trigger.dev/express';
createExpressServer(client);
