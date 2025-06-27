import {
  CreateProductRequest,
  PresignedUrlRequest,
  PresignedUrlResponse,
  Product,
  UpdateProductRequest,
} from "../types/product";

// You'll need to replace this with your actual API Gateway URL
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev";

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Get all products
  async getProducts(): Promise<{ products: Product[] }> {
    return this.request<{ products: Product[] }>("/products");
  }

  // Get a specific product
  async getProduct(id: string): Promise<Product> {
    return this.request<Product>(`/products/${id}`);
  }

  // Create a new product
  async createProduct(product: CreateProductRequest): Promise<Product> {
    return this.request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  // Update a product
  async updateProduct(id: string, product: UpdateProductRequest): Promise<Product> {
    return this.request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  // Delete a product
  async deleteProduct(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Generate presigned URL for image upload
  async generatePresignedUrl(request: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    return this.request<PresignedUrlResponse>("/products/upload", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Upload image to S3 using presigned URL
  async uploadImage(presignedUrl: string, file: File): Promise<void> {
    await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });
  }
}

export const apiService = new ApiService();
