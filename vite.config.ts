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

    // ==========================================================================
    // إعدادات البناء للإنتاج مع تحسينات الأمان والأداء
    // ==========================================================================
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,

      // ❌ تعطيل Source Maps في الإنتاج - مهم جداً للأمان
      sourcemap: false,

      // تقسيم الكود لتحسين الأداء
      rollupOptions: {
        output: {
          // تقسيم المكتبات إلى chunks منفصلة
          manualChunks: {
            // مكتبات React الأساسية
            "react-vendor": ["react", "react-dom"],
            // مكتبات Radix UI
            "radix-ui": [
              "@radix-ui/react-accordion",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
            ],
            // مكتبات الأيقونات
            icons: ["lucide-react"],
          },
          // تنسيق أسماء الملفات
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },

      // تصغير الكود
      minify: "terser",
      terserOptions: {
        compress: {
          // إزالة console.log في الإنتاج
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
        format: {
          // إزالة التعليقات
          comments: false,
        },
      },

      // حد حجم التحذير (بالكيلوبايت)
      chunkSizeWarningLimit: 500,
    },

    // ==========================================================================
    // إعدادات الخادم للتطوير
    // ==========================================================================
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

    // ==========================================================================
    // إعدادات المعاينة
    // ==========================================================================
    preview: {
      port: 4173,
      strictPort: true,
    },

    // ==========================================================================
    // تحسينات إضافية
    // ==========================================================================
    esbuild: {
      // إزالة console و debugger في الإنتاج
      drop: isProduction ? ["console", "debugger"] : [],
    },
  };
});
