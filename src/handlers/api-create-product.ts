import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 as uuid } from "uuid";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

interface Product {
  PK: string;
  SK: string;
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const body = JSON.parse(event.body);
    const now = new Date().toISOString();

    const id = uuid();

    const product: Product = {
      id,
      name: body.name,
      price: parseFloat(body.price),
      description: body.description || "",
      image: body.image || "",
      created_at: now,
      updated_at: now,
      PK: "PRODUCT",
      SK: id,
    };

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: product,
    });

    await ddbDocClient.send(command);

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
