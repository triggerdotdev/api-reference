import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import { fromEnv } from "@aws-sdk/credential-providers";
import z from "zod";

const client = new TriggerClient({ id: "api-reference" });

// this reference example assumes that, you have setup AWS account and created a lambda function
// more at: https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-lambda/Interface/LambdaClientConfig/ 
// https://github.com/aws/aws-sdk-js-v3/tree/main/packages/credential-providers
const lambdaClient = new LambdaClient({
    region: process.env.AWS_REGION,
    credentials: fromEnv(),
});

// Define a Trigger job to invoke the Lambda function
client.defineJob({
    // Job metadata
    id: "invoke-aws-lambda-function",
    name: "Invoke AWS Lambda function",
    version: "1.0.0",

    trigger: eventTrigger({
        name: "aws",

        // lambda function computes area of an rectangle, as such payload object contains length and width
        schema: z.object({
            funcName: z.string(),
            payloadObject: z.object({ length: z.number(), width: z.number() }),
        }),
    }),

    run: async (payload, io, ctx) => {
        //wrap an SDK call in io.runTask so it's resumable and displays in logs
        const result = await io.runTask(
            "Invoke lambda",
            async () => {
                // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_lambda_code_examples.html
                // this is the regular AWS SDK
                const command = new InvokeCommand({
                    FunctionName: payload.funcName,
                    Payload: JSON.stringify(payload.payloadObject),
                    LogType: LogType.Tail,
                });

                const { Payload, LogResult } = await lambdaClient.send(command);

                const result = Buffer.from(Payload).toString();
                const logs = Buffer.from(LogResult, "base64").toString();

                // returns computed aread and assosiated logs as task output
                return { result, logs };
            },
            //you can add metadata to the task to improve the display in the logs
            { name: "Invoke Lambda", icon: "aws" }
        );
    },
});

// Start Express server
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
