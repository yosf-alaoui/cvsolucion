import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, type Plugin } from "vite";

function deferPublicStylesheet(): Plugin {
  return {
    name: "defer-public-stylesheet",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        if (path.basename(context.filename) !== "index.html") return html;

        let deferred = false;
        const transformed = html.replace(
          /<link rel="stylesheet"[^>]*>/g,
          (stylesheet) => {
            deferred = true;
            const preload = stylesheet.replace(
              'rel="stylesheet"',
              'rel="preload" as="style" data-app-stylesheet',
            );
            return `${preload}<noscript>${stylesheet}</noscript>`;
          },
        );

        if (!deferred) return html;

        const loader = `<script>
    (() => {
      document.documentElement.classList.add("css-deferred");
      const stylesheets = Array.from(document.querySelectorAll("link[data-app-stylesheet]"));
      let remaining = stylesheets.length;
      const markReady = () => {
        remaining -= 1;
        if (remaining > 0) return;
        document.documentElement.classList.add("styles-ready");
        window.dispatchEvent(new Event("cvsolucion:styles-ready"));
      };
      if (!remaining) {
        document.documentElement.classList.add("styles-ready");
        return;
      }
      stylesheets.forEach((stylesheet) => {
        const activate = () => {
          stylesheet.rel = "stylesheet";
          markReady();
        };
        stylesheet.addEventListener("load", activate, { once: true });
        stylesheet.addEventListener("error", activate, { once: true });
      });
    })();
  </script>`;

        return transformed.replace("</head>", `${loader}\n</head>`);
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react(), tailwindcss(), deferPublicStylesheet()],
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
      emptyOutDir: false,
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, "client", "index.html"),
          admin: path.resolve(import.meta.dirname, "client", "admin.html"),
        },
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
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
