"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#F0F1F3",
          color: "#0E1116",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "20px",
            maxWidth: "420px",
            textAlign: "center"
          }}
        >
          <div style={{ display: "grid", gap: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "#0052CC",
                fontWeight: 600
              }}
            >
              Error crítico
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.5px"
              }}
            >
              La app no pudo cargar
            </h1>
            <p style={{ margin: 0, fontSize: "15px", color: "#4B5563" }}>
              Tuvimos un problema grave al inicializar. Reintentá — si persiste,
              recargá la página.
            </p>
            {error.digest ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#6B7280",
                  opacity: 0.8
                }}
              >
                ID: <code>{error.digest}</code>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={reset}
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              border: "none",
              background: "#0052CC",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
