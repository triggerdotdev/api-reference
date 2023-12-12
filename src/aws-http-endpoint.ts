import { TriggerClient } from "@trigger.dev/sdk";

// hide-code
const client = new TriggerClient({ id: "api-reference" });
// end-hide-code

// SNS Message blog https://repost.aws/knowledge-center/sns-lambda-webhooks-chime-slack-teams
// Create topic in SNS console
// Create Lambda function
// Configure Lambda function custom code from the blog and update trigger HTTP endpoint and secret
// Deploy and test

const aws = client.defineHttpEndpoint({
  id: "aws",
  source: "aws.com",
  icon: "aws",
    verify: async (request) => {
    const secret = request.headers.get("x-aws-secret");
    if (secret === process.env.AWS_WEBHOOK_SECRET) {
      return { success: true };
    }
    return { success: false, reason: "Verification failed" };
  },
});

client.defineJob({
  id: "http-aws",
  name: "HTTP aws",
  version: "1.0.0",
  enabled: true,
  //create a trigger from the HTTP endpoint
  trigger: aws.onRequest(),
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
