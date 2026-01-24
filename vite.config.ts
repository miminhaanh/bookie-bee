import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ESM: tự định nghĩa __dirname từ import.meta.url để alias hoạt động ổn định
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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