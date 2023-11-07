import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import { fromEnv } from "@aws-sdk/credential-providers";
import z from "zod";

// Create a TriggerClient for managing trigger jobs
const client = new TriggerClient({ id: "api-reference" });

// AWS Lambda setup assumed. For more information on AWS Lambda:
// https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html

// Create an AWS Lambda client using AWS SDK for JavaScript (v3)
// For AWS SDK Lambda documentation:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-lambda/Interface/LambdaClientConfig/
// AWS SDK Credential Providers:
// https://github.com/aws/aws-sdk-js-v3/tree/main/packages/credential-providers
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
});

// Define a Trigger job to invoke the AWS Lambda function
client.defineJob({
  // Job metadata
  id: "invoke-aws-lambda-function",
  name: "Invoke AWS Lambda function",
  version: "1.0.0",

  // Set up a trigger for this job, in this case, an event trigger
  trigger: eventTrigger({
    name: "aws",

    // Define the schema for the payload. In this case, it expects a function name and a payload object with length and width.
    schema: z.object({
      funcName: z.string(),
      payloadObject: z.object({ length: z.number(), width: z.number() }),
    }),
  }),

  // Define the code to run when the job is triggered
  run: async (payload, io, ctx) => {
    // Wrap an SDK call in io.runTask to make it resumable and display it in logs
    const result = await io.runTask(
      "Invoke Lambda",
      async () => {
        // Create an AWS Lambda invocation command
        const command = new InvokeCommand({
          FunctionName: payload.funcName,
          Payload: JSON.stringify(payload.payloadObject),
          LogType: LogType.Tail,
        });

        // Send the command to AWS Lambda
        const { Payload, LogResult } = await lambdaClient.send(command);

        // Process the Lambda response and logs
        const result = Buffer.from(Payload).toString();
        const logs = Buffer.from(LogResult, "base64").toString();

        // Return the computed area and associated logs as task output
        return { result, logs };
      },
      // Add metadata to the task to improve its display in the logs
      { name: "Invoke Lambda", icon: "aws" }
    );
  },
});

// Start an Express server using the Trigger client
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
