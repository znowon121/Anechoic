import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// ─── Shared design tokens for the Utility Modal system ────────────────────────
export const ModalTokens = {
  // Surfaces
  overlayBg: "rgba(0, 0, 0, 0.18)",
  surfaceBg: "#FFFFFF",
  surfaceBorder: "rgba(0, 0, 0, 0.06)",
  surfaceShadow:
    "0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
  surfaceRadius: 16,

  // Header
  headerBorder: "#F0F0F2",

  // Typography
  titleColor: "#1F2023",
  subtitleColor: "#6F7278",
  tertiaryColor: "#9EA2A8",
  mutedColor: "#B4B8BF",

  // Inputs
  fieldBg: "rgba(247,247,248,0.85)",
  fieldBorder: "#E4E4E7",
  fieldBorderFocus: "#9EA2A8",
  fieldShadowRest: "inset 0 1px 2px rgba(0,0,0,0.03), 0 0 0 0.5px rgba(0,0,0,0.02)",
  fieldShadowFocus: "0 0 0 3px rgba(158,162,168,0.12), 0 1px 3px rgba(0,0,0,0.04)",
  fieldRadius: 11,
  fieldText: "#1F2023",
  fieldPlaceholder: "#B4B8BF",

  // Rows
  rowHoverBg: "#FAFAFA",
  rowBorder: "#F4F4F5",

  // Buttons
  ghostHoverBg: "#F0F0F2",
  ghostActiveColor: "#1F2023",
  iconDefault: "#B4B8BF",
  iconHover: "#6F7278",

  // Accent references per tool
  accents: {
    history: { bg: "rgba(200,138,66,0.08)", color: "#C88A42", light: "rgba(200,138,66,0.05)" },
    bookmarks: { bg: "rgba(111,160,106,0.08)", color: "#6FA06A", light: "rgba(111,160,106,0.05)" },
    pomodoro: { bg: "rgba(212,107,95,0.08)", color: "#D46B5F", light: "rgba(212,107,95,0.05)" },
    schedule: { bg: "rgba(125,132,201,0.08)", color: "#7D84C9", light: "rgba(125,132,201,0.05)" },
    assistant: { bg: "rgba(154,132,214,0.08)", color: "#9A84D6", light: "rgba(154,132,214,0.05)" },
  } as Record<string, { bg: string; color: string; light: string }>,
};

// ─── Modal Shell ──────────────────────────────────────────────────────────────
interface UtilityModalProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  maxHeight?: string;
  children: React.ReactNode;
}

export function UtilityModal({
  open,
  onClose,
  width = 520,
  maxHeight = "72vh",
  children,
}: UtilityModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 180);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 1000,
        background: animating ? ModalTokens.overlayBg : "transparent",
        transition: "background 0.18s ease",
      }}
    >
      <div
        className="flex flex-col"
        style={{
          width,
          maxHeight,
          background: ModalTokens.surfaceBg,
          border: `1px solid ${ModalTokens.surfaceBorder}`,
          borderRadius: ModalTokens.surfaceRadius,
          boxShadow: ModalTokens.surfaceShadow,
          overflow: "hidden",
          opacity: animating ? 1 : 0,
          transform: animating ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Modal Header ─────────────────────────────────────────────────────────────
interface ModalHeaderProps {
  icon: React.ReactNode;
  iconAccent?: { bg: string; color: string };
  title: string;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function ModalHeader({
  icon,
  iconAccent,
  title,
  onClose,
  actions,
}: ModalHeaderProps) {
  const [closeHovered, setCloseHovered] = useState(false);

  return (
    <div
      className="flex items-center shrink-0"
      style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${ModalTokens.headerBorder}`,
        gap: 12,
      }}
    >
      {/* Icon chip */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: iconAccent?.bg ?? "#F0F0F2",
          color: iconAccent?.color ?? "#6F7278",
        }}
      >
        {icon}
      </span>

      {/* Title */}
      <span
        className="flex-1"
        style={{
          fontSize: 14,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: ModalTokens.titleColor,
        }}
      >
        {title}
      </span>

      {/* Optional action buttons */}
      {actions && (
        <div className="flex items-center" style={{ gap: 6 }}>
          {actions}
        </div>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        onMouseEnter={() => setCloseHovered(true)}
        onMouseLeave={() => setCloseHovered(false)}
        className="flex items-center justify-center shrink-0 cursor-pointer"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "none",
          background: closeHovered ? ModalTokens.ghostHoverBg : "transparent",
          color: closeHovered ? "#6F7278" : ModalTokens.iconDefault,
          transition: "all 0.12s",
        }}
      >
        <X size={14} strokeWidth={1.8} />
      </button>
    </div>
  );
}

// ─── Modal Search Input ───────────────────────────────────────────────────────
interface ModalSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function ModalSearch({
  value,
  onChange,
  placeholder = "Search...",
  icon,
}: ModalSearchProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="shrink-0"
      style={{ padding: "12px 20px 8px" }}
    >
      <div
        className="flex items-center"
        style={{
          background: focused ? "#FFFFFF" : ModalTokens.fieldBg,
          border: `1.5px solid ${focused ? ModalTokens.fieldBorderFocus : ModalTokens.fieldBorder}`,
          borderRadius: ModalTokens.fieldRadius,
          boxShadow: focused ? ModalTokens.fieldShadowFocus : ModalTokens.fieldShadowRest,
          padding: "0 12px",
          height: 36,
          gap: 9,
          transition: "all 0.15s",
        }}
      >
        {icon && (
          <span
            className="flex items-center shrink-0"
            style={{
              color: focused ? "#6F7278" : ModalTokens.fieldPlaceholder,
              transition: "color 0.15s",
            }}
          >
            {icon}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{
            color: ModalTokens.fieldText,
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "-0.01em",
            caretColor: ModalTokens.fieldText,
          }}
        />
      </div>
    </div>
  );
}

// ── Ghost Button (for header actions like "Clear All") ───────────────────────
interface ModalGhostButtonProps {
  label: string;
  onClick: () => void;
  accent?: string;
  destructive?: boolean;
}

export function ModalGhostButton({
  label,
  onClick,
  accent,
  destructive,
}: ModalGhostButtonProps) {
  const [hovered, setHovered] = useState(false);

  const restColor = accent ?? ModalTokens.tertiaryColor;
  const hoverColor = destructive ? "#C85040" : accent ?? ModalTokens.titleColor;
  const hoverBg = destructive ? "rgba(200,80,64,0.06)" : ModalTokens.ghostHoverBg;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center cursor-pointer"
      style={{
        padding: "5px 10px",
        borderRadius: 7,
        border: "none",
        background: hovered ? hoverBg : "transparent",
        color: hovered ? hoverColor : restColor,
        fontSize: 12,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        transition: "all 0.12s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Row action icon button ───────────────────────────────────────────────────
interface RowActionProps {
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  hoverColor?: string;
}

export function RowAction({ icon, onClick, title, hoverColor }: RowActionProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      className="flex items-center justify-center shrink-0 cursor-pointer"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "none",
        background: hovered ? ModalTokens.ghostHoverBg : "transparent",
        color: hovered ? (hoverColor ?? ModalTokens.iconHover) : ModalTokens.iconDefault,
        transition: "all 0.12s",
      }}
    >
      {icon}
    </button>
  );
}