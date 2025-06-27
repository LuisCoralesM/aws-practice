# Backend Stack - main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  default     = "aws-practice"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Random suffix for unique naming
resource "random_string" "suffix_image" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for Images
resource "aws_s3_bucket" "images" {
  bucket = "${var.project_name}-images-${var.environment}-${random_string.suffix_image.result}"
}

# Allow public access for images (read-only)
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy to allow public read access
resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id
  depends_on = [aws_s3_bucket_public_access_block.images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
      },
    ]
  })
}

resource "aws_s3_bucket_versioning" "images" {
  bucket = aws_s3_bucket.images.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "products" {
  name           = "${var.project_name}-products-${var.environment}-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name        = "${var.project_name}-products"
    Environment = var.environment
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.products.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}

# Lambda Functions
resource "aws_lambda_function" "create_product" {
  filename         = "handlers.zip"
  function_name    = "${var.project_name}-create-product-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "api-create-product.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.products.name
      S3_BUCKET      = aws_s3_bucket.images.bucket
    }
  }
}

resource "aws_lambda_function" "get_product" {
  filename         = "handlers.zip"
  function_name    = "${var.project_name}-get-product-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "api-get-product.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.products.name
      S3_BUCKET      = aws_s3_bucket.images.bucket
    }
  }
}

resource "aws_lambda_function" "list_products" {
  filename         = "handlers.zip"
  function_name    = "${var.project_name}-list-product-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "api-list-product.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.products.name
      S3_BUCKET      = aws_s3_bucket.images.bucket
    }
  }
}

resource "aws_lambda_function" "update_product" {
  filename         = "handlers.zip"
  function_name    = "${var.project_name}-update-product-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "api-update-product.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.products.name
      S3_BUCKET      = aws_s3_bucket.images.bucket
    }
  }
}

resource "aws_lambda_function" "delete_product" {
  filename         = "handlers.zip"
  function_name    = "${var.project_name}-delete-product-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "api-delete-product.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.products.name
      S3_BUCKET      = aws_s3_bucket.images.bucket
    }
  }
}

resource "aws_lambda_function" "generate_presigned_url" {
  filename         = "handlers.zip"
  function_name    = "${var.project_name}-generate-presigned-url-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "api-generate-presigned-url.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.products.name
      S3_BUCKET      = aws_s3_bucket.images.bucket
    }
  }
}

# Create Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "handlers.zip"
  source_dir  = "${path.module}/dist/handlers"
}

# API Gateway
resource "aws_api_gateway_rest_api" "products_api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "Products CRUD API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Resources
# /products resource - for creating and listing products
resource "aws_api_gateway_resource" "products" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  parent_id   = aws_api_gateway_rest_api.products_api.root_resource_id
  path_part   = "products"
}

# /products/{id} resource - for specific product operations
resource "aws_api_gateway_resource" "product_id" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "{id}"
}

# /products/upload resource - for generating presigned URLs
resource "aws_api_gateway_resource" "upload" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "upload"
}

# CORS OPTIONS method for /products
resource "aws_api_gateway_method" "products_options" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "products_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "products_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "products_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.products.id
  http_method = aws_api_gateway_method.products_options.http_method
  status_code = aws_api_gateway_method_response.products_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS OPTIONS method for /products/upload
resource "aws_api_gateway_method" "upload_options" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.upload.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "upload_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.upload.id
  http_method = aws_api_gateway_method.upload_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "upload_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.upload.id
  http_method = aws_api_gateway_method.upload_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "upload_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.upload.id
  http_method = aws_api_gateway_method.upload_options.http_method
  status_code = aws_api_gateway_method_response.upload_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# CORS OPTIONS method for /products/{id}
resource "aws_api_gateway_method" "product_options" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.product_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "product_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.product_id.id
  http_method = aws_api_gateway_method.product_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "product_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.product_id.id
  http_method = aws_api_gateway_method.product_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "product_options" {
  rest_api_id = aws_api_gateway_rest_api.products_api.id
  resource_id = aws_api_gateway_resource.product_id.id
  http_method = aws_api_gateway_method.product_options.http_method
  status_code = aws_api_gateway_method_response.product_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Methods and Integrations
# CREATE (POST /products)
resource "aws_api_gateway_method" "create_product" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_product" {
  rest_api_id             = aws_api_gateway_rest_api.products_api.id
  resource_id             = aws_api_gateway_resource.products.id
  http_method             = aws_api_gateway_method.create_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_product.invoke_arn
}

# LIST (GET /products) - List all products
resource "aws_api_gateway_method" "list_products" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "list_products" {
  rest_api_id             = aws_api_gateway_rest_api.products_api.id
  resource_id             = aws_api_gateway_resource.products.id
  http_method             = aws_api_gateway_method.list_products.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.list_products.invoke_arn
}

# PRESIGNED URL (POST /products/upload) - Generate presigned URL for image upload
resource "aws_api_gateway_method" "generate_presigned_url" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.upload.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "generate_presigned_url" {
  rest_api_id             = aws_api_gateway_rest_api.products_api.id
  resource_id             = aws_api_gateway_resource.upload.id
  http_method             = aws_api_gateway_method.generate_presigned_url.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.generate_presigned_url.invoke_arn
}

# READ (GET /products/{id}) - Get specific product
resource "aws_api_gateway_method" "get_product" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.product_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_product" {
  rest_api_id             = aws_api_gateway_rest_api.products_api.id
  resource_id             = aws_api_gateway_resource.product_id.id
  http_method             = aws_api_gateway_method.get_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_product.invoke_arn
}

# UPDATE (PUT /products/{id})
resource "aws_api_gateway_method" "update_product" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.product_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_product" {
  rest_api_id             = aws_api_gateway_rest_api.products_api.id
  resource_id             = aws_api_gateway_resource.product_id.id
  http_method             = aws_api_gateway_method.update_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.update_product.invoke_arn
}

# DELETE (DELETE /products/{id})
resource "aws_api_gateway_method" "delete_product" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  resource_id   = aws_api_gateway_resource.product_id.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "delete_product" {
  rest_api_id             = aws_api_gateway_rest_api.products_api.id
  resource_id             = aws_api_gateway_resource.product_id.id
  http_method             = aws_api_gateway_method.delete_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.delete_product.invoke_arn
}

# Lambda Permissions
resource "aws_lambda_permission" "create_product" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.products_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_product" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.products_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "update_product" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.products_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "list_products" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list_products.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.products_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete_product" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.products_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "generate_presigned_url" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.generate_presigned_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.products_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "products_api" {
  depends_on = [
    aws_api_gateway_integration.create_product,
    aws_api_gateway_integration.get_product,
    aws_api_gateway_integration.list_products,
    aws_api_gateway_integration.update_product,
    aws_api_gateway_integration.delete_product,
    aws_api_gateway_integration.generate_presigned_url,
    aws_api_gateway_integration.products_options,
    aws_api_gateway_integration.product_options,
    aws_api_gateway_integration.upload_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.products_api.id
}

# Add this after the deployment resource
resource "aws_api_gateway_stage" "products_api" {
  rest_api_id   = aws_api_gateway_rest_api.products_api.id
  deployment_id = aws_api_gateway_deployment.products_api.id
  stage_name    = var.environment
}

# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_deployment.products_api.invoke_url
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for images"
  value       = aws_s3_bucket.images.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for images"
  value       = aws_s3_bucket.images.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket for images"
  value       = aws_s3_bucket.images.bucket_domain_name
}

output "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket for images"
  value       = aws_s3_bucket.images.bucket_regional_domain_name
}

output "s3_bucket_website_endpoint" {
  description = "Website endpoint of the S3 bucket for images"
  value       = aws_s3_bucket.images.website_endpoint
}

output "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "ARN of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_website_endpoint" {
  description = "Website endpoint of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.website_endpoint
}

output "frontend_bucket_website_domain" {
  description = "Website domain of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.website_domain
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.products.name
}

output "environment" {
  description = "Name of the DynamoDB table"
  value       = var.environment
}