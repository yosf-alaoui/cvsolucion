import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),

    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, "client", "index.html"),
          admin: path.resolve(import.meta.dirname, "client", "admin.html"),
        },
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
            "radix-ui": [
              "@radix-ui/react-accordion",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
            ],
            icons: ["lucide-react"],
            motion: ["framer-motion"],
            forms: ["react-hook-form", "zod", "@hookform/resolvers"],
            stripe: ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          },
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
        format: {
          comments: false,
        },
      },
      chunkSizeWarningLimit: 500,
    },

    server: {
      port: 3000,
      strictPort: false,
      host: true,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
      allowedHosts: [
        ".manuspre.computer",
        ".manus.computer",
        ".manus-asia.computer",
        ".manuscomputer.ai",
        ".manusvm.computer",
        "localhost",
        "127.0.0.1",
        "cvsolucion.com",
        "www.cvsolucion.com",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },

    preview: {
      port: 4173,
      strictPort: true,
    },

    esbuild: {
      drop: isProduction ? ["console", "debugger"] : [],
    },
  };
});
