import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { Check, Info, AlertTriangle, AlertCircle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ─── Per-type visual config ───────────────────────────────────────────────────
const TYPE: Record<
  ToastType,
  { icon: React.ReactNode; color: string; bg: string; bar: string }
> = {
  success: {
    icon: <Check size={12} strokeWidth={2.4} />,
    color: "#3D8A64",
    bg: "rgba(61,138,100,0.09)",
    bar: "#3D8A64",
  },
  info: {
    icon: <Info size={12} strokeWidth={1.9} />,
    color: "#6F7278",
    bg: "rgba(111,114,120,0.08)",
    bar: "#9EA2A8",
  },
  warning: {
    icon: <AlertTriangle size={12} strokeWidth={1.9} />,
    color: "#C88A42",
    bg: "rgba(200,138,66,0.09)",
    bar: "#C88A42",
  },
  error: {
    icon: <AlertCircle size={12} strokeWidth={1.9} />,
    color: "#C04040",
    bg: "rgba(192,64,64,0.09)",
    bar: "#C04040",
  },
};

// ─── Single toast card ────────────────────────────────────────────────────────
function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const cfg = TYPE[toast.type];
  const [dimHov, setDimHov] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px 10px 14px",
        background: "#FFFFFF",
        border: "1px solid #E6E6E9",
        borderRadius: 12,
        boxShadow:
          "0 4px 20px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.04)",
        minWidth: 238,
        maxWidth: 316,
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? "translateX(0)" : "translateX(16px)",
        transition: "opacity 0.22s ease, transform 0.22s ease",
        pointerEvents: "auto",
        position: "relative",
        overflow: "hidden",
        willChange: "opacity, transform",
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: cfg.bar,
          opacity: 0.65,
          borderRadius: "12px 0 0 12px",
        }}
      />

      {/* Icon chip */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 6,
          background: cfg.bg,
          color: cfg.color,
          flexShrink: 0,
        }}
      >
        {cfg.icon}
      </span>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.012em",
            color: "#1F2023",
            lineHeight: "16px",
          }}
        >
          {toast.title}
        </p>
        {toast.message && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 11.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              color: "#9EA2A8",
              lineHeight: "15px",
            }}
          >
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        onMouseEnter={() => setDimHov(true)}
        onMouseLeave={() => setDimHov(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 5,
          border: "none",
          background: dimHov ? "#F2F2F4" : "transparent",
          color: dimHov ? "#6F7278" : "#C0C0C6",
          cursor: "pointer",
          flexShrink: 0,
          padding: 0,
          marginTop: 2,
          transition: "color 0.12s, background 0.12s",
        }}
      >
        <X size={9} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Stable dismiss reference
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 240);
  }, []);

  const dismissRef = useRef(dismissToast);
  dismissRef.current = dismissToast;

  const showToast = useCallback(
    (opts: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const duration = opts.duration ?? 3200;

      setToasts((prev) => [...prev, { ...opts, id, visible: false }]);

      // Trigger enter animation on next two frames
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, visible: true } : t))
          );
        });
      });

      // Auto-dismiss
      setTimeout(() => dismissRef.current(id), duration);
    },
    [] // dismissRef is a stable ref, no dep needed
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toaster — fixed bottom-right, above all modals ── */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1200,
          display: "flex",
          flexDirection: "column-reverse",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
