import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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

    const productId = event.pathParameters.id;
    const body = JSON.parse(event.body);

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

    // Build update expression
    const updateExpressions: string[] = ["updated_at = :updated_at"];
    const expressionAttributeValues: Record<string, any> = {
      ":updated_at": new Date().toISOString(),
    };
    const expressionAttributeNames: Record<string, string> = {};

    if (body.name) {
      updateExpressions.push("#name = :name");
      expressionAttributeValues[":name"] = body.name;
      expressionAttributeNames["#name"] = "name";
    }

    if (body.price !== undefined) {
      updateExpressions.push("price = :price");
      expressionAttributeValues[":price"] = parseFloat(body.price);
    }

    if (body.description !== undefined) {
      updateExpressions.push("description = :description");
      expressionAttributeValues[":description"] = body.description;
    }

    if (body.image !== undefined) {
      updateExpressions.push("image = :image");
      expressionAttributeValues[":image"] = body.image;
    }

    const updateCommand = new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: productId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: "ALL_NEW",
    });

    const response = await ddbDocClient.send(updateCommand);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "PUT",
      },
      body: JSON.stringify(response.Attributes),
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
