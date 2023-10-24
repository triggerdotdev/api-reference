import "@shopify/shopify-api/adapters/node";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import z from "zod";

// Initialize a TriggerClient
const client = new TriggerClient({ id: "api-reference" });

// Create a Shopify custom app: https://shopify.dev/tutorials/build-a-shopify-app-with-node-and-react
// Shopify SDK: https://github.com/Shopify/shopify-api-js
// Get API credentials by following this tutorial: https://youtu.be/Tn0DzYnRPVQ
// https://admin.shopify.com/store/<STORE_ID>/settings/apps/development/<APP_ID>/api_credentials
// Initialize the Shopify API client
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ["write_products"], // The scopes required for the app can be found in the Shopify Admin Apps page
  hostName: process.env.SHOPIFY_HOSTNAME!, // Ex: <STORE_ID>.myshopify.com
  apiVersion: ApiVersion.October23,
  isEmbeddedApp: false,
});

// Define a job to update product variant prices
client.defineJob({
  id: "shopify-product-variant-price",
  name: "Shopify update product variant price",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "shopify-product-variant-price",
    schema: z.object({
      productVariantId: z.number(), // The product variant ID can be found in the Shopify Admin product variant URL (e.g. https://admin.shopify.com/store/<STORE_NAME>/products/<PRODUCTS_ID>/variants/<VARIANT_ID>)
      price: z.number(), // The new price of the product variant
    }),
  }),
  run: async (payload, io, ctx) => {
    const { productVariantId: id, price } = payload;

    // Use io.runTask to make the SDK call resumable and log-friendly
    await io.runTask(
      "Shopify update product variant price",
      async () => {
        // Initialize a Shopify session
        const session = shopify.session.customAppSession(
          process.env.SHOPIFY_HOSTNAME!
        );

        // The access token can be found in the Shopify Admin Apps page
        session.accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

        // Initialize a Shopify REST client
        const client = new shopify.clients.Rest({ session });

        // Update the product variant price
        await client.put({
          path: `admin/api/${ApiVersion.October23}/variants/${id}.json`,
          data: { variant: { id, price } },
        });
      },

      // Add metadata to the task for improved log display
      { name: "Shopify update product variant price", icon: "shopify" }
    );
  },
});

// These lines set up an Express server for the TriggerClient
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
