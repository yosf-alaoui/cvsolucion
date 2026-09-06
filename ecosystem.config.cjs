const path = require("path");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "cvsolucion",
      cwd: __dirname,
      script: path.join(__dirname, "dist", "index.js"),
      interpreter: process.env.APP_NODE_INTERPRETER || "node",
      // PM2 cluster workers inherit the Node runtime that started the PM2 daemon,
      // which can differ from the interpreter selected for this application.
      // Fork mode guarantees that native dependencies use APP_NODE_INTERPRETER.
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        APP_BIND_HOST: "127.0.0.1"
      }
    }
  ]
};
