export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  created_at: string;
  updated_at: string;
  PK: string;
  SK: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  description?: string;
  image?: string;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  expiresIn: number;
  s3Url: string;
}

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  contentLength?: number;
}
