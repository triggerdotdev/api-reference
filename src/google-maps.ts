import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { Client } from "@googlemaps/google-maps-services-js";
import z from "zod";

const client = new TriggerClient({
  id: "api-reference",
});

// Get your API key here: https://console.developers.google.com/apis/credentials
// Make sure to enable the Google Maps Data API https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
// SDK Docs: https://developers.google.com/maps/documentation/javascript/overview
// Initialize the Google Maps API with your API key
const apiKey = String(process.env.GOOGLE_MAP_API_KEY);

const map = new Client({});

client.defineJob({
  id: "google-map-geocode",
  name: "Google Map Geocode",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "google-map-geocode",
    schema: z.object({
      address: z.string(),
    }),
  }),
  run: async (payload, io, ctx) => {
    const { address } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Google Map Geocode",
      async () => {
        // Make the geocode request
        const response = await map.geocode({
          params: {
            address,
            key: apiKey,
          },
        });

        // Process the geocode response here
        return JSON.parse(JSON.stringify(response.data));
      },

      // Add metadata to improve how the task displays in the logs
      { name: "Google map geocode", icon: "google" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
