module.exports = {
  apps: [
    {
      name: "cvsolucion",
      script: "/var/www/cvsolucion/dist/index.js",
      exec_mode: "cluster",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
