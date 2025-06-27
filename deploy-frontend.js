const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  console.log("🚀 Deploying frontend to S3...");

  const bucketName = execSync("terraform output -raw frontend_bucket_name", { encoding: "utf8" }).trim();
  const apiUrl = execSync("terraform output -raw api_gateway_url", { encoding: "utf8" }).trim();

  console.log(`📦 Bucket name: ${bucketName}`);
  console.log(`🔗 API URL: ${apiUrl}`);

  console.log("🔨 Building frontend with API URL...");
  execSync(`cd frontend && yarn build`, {
    stdio: "inherit",
    env: { ...process.env, VITE_API_URL: apiUrl },
  });

  const distPath = path.join(__dirname, "frontend", "dist");
  if (!fs.existsSync(distPath)) {
    console.error("❌ frontend/dist folder not found. Build failed.");
    process.exit(1);
  }

  console.log("📤 Syncing files to S3...");
  execSync(`aws s3 sync frontend/dist/ s3://${bucketName} --delete`, { stdio: "inherit" });

  console.log("✅ Frontend deployed successfully!");
  console.log(`🌐 Website URL: http://${bucketName}.s3-website-us-east-1.amazonaws.com`);
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
