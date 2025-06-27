# aws-practice

---

## Getting Started

### Prerequisites

- Node.js (18+ recommended)
- Yarn
- AWS CLI (configured)
- Terraform (v1.0+)

### 1. Install dependencies

```bash
yarn install
cd frontend && yarn install
```

### 2. Deploy AWS Infrastructure

```bash
yarn deploy
```

This runs the build and applies Terraform (`main.tf`, `frontend.tf`).

### 3. Deploy Frontend

```bash
yarn deploy:frontend
```

- Builds the React app with the correct API URL from Terraform output
- Uploads the build to the S3 website bucket

### 4. Access the App

- **Frontend**: Visit the S3 website endpoint (see Terraform output: `frontend_bucket_website_endpoint`)
- **API**: The API Gateway URL is also output by Terraform

## Development

- **Frontend**:
  ```bash
  cd frontend
  yarn dev
  ```
- **Backend**:  
  Edit Lambda handler files in `src/handlers/`, then redeploy with `yarn deploy`.

---

## Useful Scripts

- `yarn deploy` – Build and deploy backend (Terraform)
- `yarn deploy:frontend` – Build and deploy frontend to S3
- `yarn destroy` – Destroy all AWS resources

---
