const path = require("path");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "cvsolucion",
      cwd: __dirname,
      script: path.join(__dirname, "dist", "index.js"),
      exec_mode: "cluster",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        APP_BIND_HOST: "127.0.0.1"
      }
    }
  ]
};
