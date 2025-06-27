const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const handlersDir = "./src/handlers/";
const files = fs
  .readdirSync(handlersDir)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => path.join(handlersDir, file));

async function build() {
  try {
    await esbuild.build({
      entryPoints: files,
      bundle: true,
      outdir: "./dist/handlers/",
      platform: "node",
      target: "node18",
      format: "cjs",
      sourcemap: false,
      minify: false,
      external: ["@aws-sdk/*", "aws-sdk"],
      packages: "bundle",
      define: {
        global: "globalThis",
      },
      banner: {
        js: "#!/usr/bin/env node",
      },
    });

    console.log("✅ Build completed successfully");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();

module.exports = { build };
