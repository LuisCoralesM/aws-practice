import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.pathParameters?.id) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Product ID is required" }),
      };
    }

    const productId = event.pathParameters.id;

    // Check if product exists
    const getCommand = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: productId },
    });

    const existingProduct = await ddbDocClient.send(getCommand);
    if (!existingProduct.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Product not found" }),
      };
    }

    // Delete the product
    const deleteCommand = new DeleteCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: productId },
    });

    await ddbDocClient.send(deleteCommand);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "DELETE",
      },
      body: JSON.stringify({ message: "Product deleted successfully" }),
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
