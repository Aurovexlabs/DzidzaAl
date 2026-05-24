import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const manualChunks = (id: string) => {
  if (id.includes("node_modules")) {
    if (id.includes("@tanstack")) return "vendor-tanstack";
    if (
      id.includes("react-dom") ||
      id.includes("/react/") ||
      id.includes("scheduler") ||
      id.includes("loose-envify") ||
      id.includes("object-assign") ||
      id.includes("react-is") ||
      id.includes("use-sync-external-store")
    ) {
      return "vendor-react";
    }
    if (id.includes("socket.io-client")) return "vendor-socket";
    if (id.includes("lucide-react")) return "vendor-icons";
    if (id.includes("date-fns")) return "vendor-date";
    if (id.includes("react-hot-toast")) return "vendor-toast";
    if (id.includes("axios")) return "vendor-axios";
    if (id.includes("zustand")) return "vendor-state";
  }

  if (id.includes("/src/components/Layout.tsx")) return "shell";
  if (id.includes("/src/components/ui.tsx")) return "ui";
  if (id.includes("/src/pages/AuthPages.tsx")) return "pages-auth";
  if (id.includes("/src/pages/PublicPages.tsx")) return "pages-public";
  if (id.includes("/src/pages/SystemPages.tsx")) return "pages-system";
  if (id.includes("/src/pages/DashboardPage.tsx")) return "pages-dashboard";
  if (id.includes("/src/pages/QuizPage.tsx")) return "pages-quiz";
  if (id.includes("/src/pages/AIToolsPages.tsx")) return "pages-ai";
  if (id.includes("/src/pages/OtherPages.tsx")) return "pages-other";
  if (id.includes("/src/pages/NewFeaturePages.tsx")) return "pages-features";
  if (id.includes("/src/pages/TutorPage.tsx")) return "pages-tutor";

  return undefined;
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/uploads": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
