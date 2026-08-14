module.exports = {
  apps: [
    {
      name: "video-courses-api",
      script: "./artifacts/api-server/dist/index.mjs",
      cwd: "./",
      node_args: "--env-file=.env",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
