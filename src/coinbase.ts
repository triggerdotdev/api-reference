import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { createHmac } from "crypto";

const client = new TriggerClient({ id: "api-reference" });

// Get your API Key and Secret for follow: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-key-authentication
// Keep your API Secret when you create it, you can't see it again.
// API Key scopes required: wallet:transactions:send
// Send money API: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-transactions#send-money
// Generates the endpoint URL and request options for the Coinbase API
function generateReqOptions({
  accountId,
  body,
  method = "POST",
}: {
  accountId: string;
  body: string;
  method?: string;
}): {
  endpointURL: string;
  requestOptions: RequestInit;
} {
  const path = `/v2/accounts/${accountId}/transactions`;
  const endpointURL = `https://api.coinbase.com${path}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = createHmac("sha256", process.env.COINBASE_API_SECRET!)
    .update(timestamp + method + path + body)
    .digest("hex");

  const requestOptions: RequestInit = {
    method,
    body,
    headers: {
      "Content-Type": "application/json",
      "CB-ACCESS-SIGN": signature,
      "CB-ACCESS-TIMESTAMP": timestamp,
      "CB-ACCESS-KEY": process.env.COINBASE_API_KEY!,
      "CB-VERSION": "2023-10-29",
    },
  };
  return { endpointURL, requestOptions };
}

client.defineJob({
  id: "coinbase-send-money",
  name: "Coinbase Send Money",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "coinbase-send-money",
    schema: z.object({
      // Your asset account ID. Goto 'My Asset'>Select currency>'Primary balance' now look up the url
      // https://www.coinbase.com/accounts/<account_id>
      accountId: z.string(),
      to: z.string(), // e.g. "0x1234..."
      amount: z.string(), // e.g. "0.1"
      currency: z.string(), // e.g. "ETH"
      idem: z.string().optional(), // optional, but recommended to prevent duplicate transactions
    }),
  }),
  run: async (payload, io, ctx) => {
    const { accountId, to, amount, currency, idem } = payload;

    // Wrap an SDK call in io.runTask so it's resumable and displays in logs
    await io.runTask(
      "Coinbase Send Money",
      async () => {
        // Generate the endpoint URL and request options for the Coinbase API
        const { endpointURL, requestOptions } = generateReqOptions({
          accountId,
          body: JSON.stringify({
            type: "send",
            to,
            amount,
            currency,
            idem,
          }),
        });

        // Make POST request using Fetch API
        return await fetch(endpointURL, requestOptions).then((response) =>
          response.json()
        );
      },

      // Add metadata to the task to improve the display in the logs
      { name: "Coinbase Send Money", icon: "coinbase" }
    );
  },
});

// These lines can be removed if you don't want to use express
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
