// src/context/ToastContext.jsx
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "var(--surface2)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(16,245,149,0.35)"
                : toast.type === "error"
                ? "rgba(255,77,106,0.35)"
                : "rgba(47,47,228,0.35)"
            }`,
            borderRadius: "12px",
            padding: "12px 20px",
            fontSize: "14px",
            fontWeight: 500,
            color:
              toast.type === "success"
                ? "var(--green)"
                : toast.type === "error"
                ? "var(--red)"
                : "var(--text)",
            whiteSpace: "nowrap",
            animation: "toastIn 0.3s ease",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
