import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    // Dùng cổng 8081 để khớp với origin đã được cấu hình CORS
    // trong Supabase / Google Fonts (trước đây app chạy ở 8081)
    port: 8081,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));