import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Performance: code splitting strategy
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router") || (id.includes("/react/") && !id.includes("react-three"))) {
              return "vendor-react";
            }
            if (id.includes("@tanstack") || id.includes("axios")) {
              return "vendor-query";
            }
            if (id.includes("@radix-ui")) {
              return "vendor-ui";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("gsap")) {
              return "vendor-gsap";
            }
            if (id.includes("three") || id.includes("@react-three")) {
              return "vendor-three";
            }
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "vendor-form";
            }
          }
        },
      },
    },
    // Target modern browsers
    target: "es2020",
    // Optimize CSS
    cssMinify: true,
    // Source maps for production debugging
    sourcemap: false,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "framer-motion",
      "gsap",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
    ],
  },
});
