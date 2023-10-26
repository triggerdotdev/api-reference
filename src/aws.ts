import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import z from "zod";

// Create Trigger and Lambda clients
const client = new TriggerClient({ id: "api-reference" });
const lambdaClient = new LambdaClient({});

// Define a Trigger job to invoke the Lambda function
client.defineJob({
    // Job metadata
    id: "invoke-aws-lambda-function",
    name: "Invoke AWS Lambda function",
    version: "1.0.0",

    trigger: eventTrigger({
        name: "aws",
        schema: z.object({
            funcName: z.string(),
            payloadData: z.string(),
        }),
    }),

    run: async (payload, io, ctx) => {
        //wrap an SDK call in io.runTask so it's resumable and displays in logs
        const result = await io.runTask(
            "Invoke aws lambda function",
            async () => {
                // Invoke the Lambda function with InvokeCommand using AWS Lambda SDK

                const command = new InvokeCommand({
                    FunctionName: payload.funcName,
                    Payload: JSON.stringify(payload.payloadData),
                    LogType: LogType.Tail,
                });

                const { Payload, LogResult } = await lambdaClient.send(command);

                const result = Buffer.from(Payload).toString();
                // const logs = Buffer.from(LogResult, "base64").toString();

                return result;
                // return { logs, result };
            }
        );
    },
});

// Start Express server
import { createExpressServer } from "@trigger.dev/express";
createExpressServer(client);
