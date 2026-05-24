import { RouterProvider } from "@tanstack/react-router";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { Spinner } from "./components/ui";
import "./index.css";
import { router } from "./router/index";
import { authApi } from "./services/apiServices";
import { connectSocket, disconnectSocket } from "./services/socket";
import { useAuthStore } from "./store/authStore";
import { initTheme, useThemeStore } from "./store/themeStore";

// ─── InnerApp ─────────────────────────────────────────────────────────────────
// The docs require reading auth state in a React component and passing it to
// RouterProvider via the context prop — hooks cannot be called inside beforeLoad.
// This is the official pattern from:
// https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes
function InnerApp() {
  const {
    isAuthenticated,
    user,
    setAuth,
    clearAuth,
    setLoading,
    isLoading,
    accessToken,
  } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  // ── Session restore on mount ─────────────────────────────────────────────
  useEffect(() => {
    initTheme();

    authApi
      .refresh()
      .then((res) => {
        const payload = (res.data as any).data;
        if (!payload?.user || !payload?.accessToken) {
          clearAuth();
          return;
        }
        setAuth(payload.user, payload.accessToken);
        router.invalidate();
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Socket connect / disconnect ──────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, accessToken]);

  // ── Toaster styles ───────────────────────────────────────────────────────
  const toastStyle = {
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13.5,
    background: isDark ? "#1a1928" : "#ffffff",
    color: isDark ? "#e8e6f0" : "#1a1a2e",
    border: isDark
      ? "1px solid rgba(255,255,255,0.07)"
      : "1px solid rgba(0,0,0,0.08)",
  };

  // ── Loading screen while session is being restored ───────────────────────
  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--hero-bg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontFamily: "'Lora',serif",
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            Dz
          </div>
          <span
            style={{
              fontFamily: "'Lora',serif",
              fontWeight: 700,
              fontSize: 22,
              color: "var(--ink)",
            }}
          >
            DzidzaAI
          </span>
        </div>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <>
      {/* Pass auth state as router context — the official TanStack Router pattern */}
      <RouterProvider
        router={router}
        context={{ auth: { isAuthenticated, user } }}
      />
      <Toaster position="top-right" toastOptions={{ style: toastStyle }} />
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
// Wrap InnerApp so it has access to the Zustand stores.
// InnerApp reads from the stores and feeds auth into RouterProvider.
function App() {
  React.useState(() => initTheme());
  return <InnerApp />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
