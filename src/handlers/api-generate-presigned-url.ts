import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 as uuid } from "uuid";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { fileName, fileType, contentLength } = body;

    // Validate required fields
    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "fileName and fileType are required",
        }),
      };
    }

    // Validate file type (only allow images)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Only image files are allowed (jpeg, jpg, png, gif, webp)",
        }),
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength && contentLength > maxSize) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "File size must be less than 10MB",
        }),
      };
    }

    // Generate unique file name
    const fileExtension = fileName.split(".").pop();
    const uniqueFileName = `${uuid()}.${fileExtension}`;
    const key = `products/${uniqueFileName}`;

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: fileType,
      ...(contentLength && { ContentLength: contentLength }),
      // Add metadata to track upload
      Metadata: {
        "original-name": fileName,
        "uploaded-at": new Date().toISOString(),
      },
    });

    // Generate presigned URL (expires in 15 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    // Return presigned URL and file information
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        presignedUrl,
        key,
        fileName: uniqueFileName,
        originalFileName: fileName,
        fileType,
        expiresIn: 900,
        s3Url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
      }),
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to generate presigned URL",
        message: (error as Error).message,
      }),
    };
  }
};
