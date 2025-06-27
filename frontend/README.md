# AWS Practice - Frontend

A modern React application for managing products with AWS backend integration.

## Features

- **Product Management**: Create, read, update, and delete products
- **Image Upload**: Upload product images directly to S3 using presigned URLs
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Search & Filter**: Search products by name or description
- **Sorting**: Sort products by name, price, or creation date
- **Grid/List View**: Toggle between different view modes

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Prerequisites

- Node.js 16+ and yarn
- AWS backend deployed (API Gateway, Lambda, DynamoDB, S3)

## Setup

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Configure API URL**:
   Create a `.env` file in the frontend directory:

   ```env
   VITE_API_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
   ```

   Replace `your-api-gateway-url` with your actual API Gateway URL from the Terraform output.

3. **Start development server**:

   ```bash
   yarn dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx      # Main layout with header/navigation
│   ├── ProductCard.tsx # Product card component
│   └── ImageUpload.tsx # Image upload component
├── pages/              # Page components
│   ├── ProductList.tsx # Main products list page
│   ├── ProductDetail.tsx # Individual product view
│   ├── CreateProduct.tsx # Create new product form
│   └── EditProduct.tsx # Edit existing product form
├── services/           # API services
│   └── api.ts         # API client for backend communication
├── types/              # TypeScript type definitions
│   └── product.ts     # Product-related types
├── App.tsx            # Main app component with routing
├── main.tsx           # App entry point
└── index.css          # Global styles with Tailwind
```

## API Integration

The app integrates with the following AWS backend endpoints:

- `GET /products` - List all products
- `POST /products` - Create a new product
- `GET /products/{id}` - Get a specific product
- `PUT /products/{id}` - Update a product
- `DELETE /products/{id}` - Delete a product
- `POST /products/upload` - Generate presigned URL for image upload

## Image Upload Flow

1. User selects an image file
2. Frontend requests a presigned URL from the backend
3. Backend generates a presigned URL for S3 upload
4. Frontend uploads the image directly to S3 using the presigned URL
5. The S3 URL is saved with the product data

## Deployment

To deploy the frontend to S3/CloudFront:

1. **Build the project**:

   ```bash
   yarn build
   ```

2. **Upload the `dist` folder** to your S3 bucket

3. **Configure CloudFront** to serve the static files

## Environment Variables

- `VITE_API_URL` - Your API Gateway URL (required)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add proper error handling
4. Test your changes thoroughly
