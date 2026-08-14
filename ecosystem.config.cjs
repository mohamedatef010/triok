const path = require("path");

module.exports = {
  apps: [
    {
      name: "video-courses-api",
      script: "./artifacts/api-server/dist/index.mjs",
      cwd: __dirname,
      node_args: "--env-file=.env",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
