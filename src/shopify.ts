import "@shopify/shopify-api/adapters/node";
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import z from "zod";

// Initialize a TriggerClient
const client = new TriggerClient({
  id: "api-reference",
});

// Create a Shopify custom app: https://shopify.dev/tutorials/build-a-shopify-app-with-node-and-react
// Shopify SDK: https://github.com/Shopify/shopify-api-js
// Initialize the Shopify API client
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: ["write_products"],
  hostName: process.env.SHOPIFY_HOSTNAME!,
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
    const { productVariantId, price } = payload;

    // Use io.runTask to make the SDK call resumable and log-friendly
    await io.runTask(
      "Shopify update product variant price",
      async () => {
        // Initialize a Shopify session
        const shopifySession = shopify.session.customAppSession(
          process.env.SHOPIFY_HOSTNAME!
        );

        // Set the admin access token for the Shopify session
        shopifySession.accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

        // Initialize a GraphQL Admin Client
        const graphQLAdminClient = new shopify.clients.Graphql({
          session: shopifySession,
        });

        // Execute a GraphQL mutation to update the product variant's price
        await graphQLAdminClient.query({
          data: {
            query: `mutation ($input: ProductVariantInput!) {
              productVariantUpdate(input: $input) {
                productVariant {
                  price
                }
              }
            }`,
            variables: {
              input: {
                id: `gid://shopify/ProductVariant/${productVariantId}`,
                price,
              },
            },
          },
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
