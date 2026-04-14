import React, { useState } from "react";
import {
  Plus,
  History,
  Bookmark,
  Sparkles,
  Download,
  Settings,
  ChevronRight,
  ArrowLeft,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { useToast } from "./ToastProvider";

// ─── Design tokens ────────────────────────────────────────────────────────────
const P = {
  // Panel shell
  panelBg: "#FFFFFF",
  panelBorder: "#E6E6E9",
  panelShadow:
    "0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.05)",
  panelRadius: 13,

  // Typography
  titleColor: "#1F2023",
  sectionLabel: "#8E8E9C",
  labelColor: "#1F2023",
  labelSecondary: "#6F7278",
  valueColor: "#9EA2A8",
  mutedColor: "#B8B8BF",

  // Rows
  rowHoverBg: "#F6F6F7",
  divider: "#F0F0F2",

  // Icon chip
  iconBg: "#F2F2F4",
  iconColor: "#8A8E94",

  // Control tokens
  toggleOn: "#7A909B",
  toggleOff: "#CBCBCF",

  // Select chip
  selectBg: "#F4F4F5",
  selectBorder: "#E6E6E9",
  selectHoverBg: "#ECECEF",

  // Segmented
  segBg: "#EDEDED",
  segActiveBg: "#FFFFFF",
  segActiveShadow:
    "0 1px 3px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.04)",

  // Close / back button
  ctrlBorder: "#E8E8EA",
  ctrlHoverBg: "#EFEFF1",
  ctrlHoverBorder: "#D8D8DC",

  // Chevron
  chevronColor: "#C8C8CC",

  // Destructive
  destructiveColor: "#C04040",
  destructiveRest: "#B84848",
};

// ─── Shared: mini toggle ──────────────────────────────────────────────────────
function PanelToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="shrink-0 cursor-pointer"
      style={{
        width: 28,
        height: 16,
        borderRadius: 8,
        background: on ? P.toggleOn : P.toggleOff,
        border: "none",
        padding: 0,
        position: "relative",
        transition: "background 0.15s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#FFFFFF",
          display: "block",
          position: "absolute",
          top: 2,
          left: on ? 14 : 2,
          transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.20)",
        }}
      />
    </button>
  );
}

// ─── Shared: section label ────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: "14px 16px 5px" }}>
      <span
        style={{
          fontSize: 10,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 650,
          letterSpacing: "0.06em",
          color: P.sectionLabel,
          textTransform: "uppercase",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Shared: row divider ──────────────────────────────────────────────────────
function RowDivider({ inset = 16 }: { inset?: number }) {
  return (
    <div
      style={{
        height: 1,
        background: P.divider,
        marginLeft: inset,
        marginRight: 16,
      }}
    />
  );
}

// ─── Settings row — toggle ─────────────────────────────────────────────────
function ToggleRow({
  label,
  value,
  onChange,
  divider = true,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  divider?: boolean;
}) {
  const [hov, setHov] = useState(false);

  return (
    <>
      <button
        onClick={() => onChange(!value)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="w-full flex items-center cursor-pointer"
        style={{
          padding: "0 16px",
          height: 35,
          background: hov ? P.rowHoverBg : "transparent",
          border: "none",
          gap: 8,
          transition: "background 0.1s",
        }}
      >
        <span
          className="flex-1 text-left"
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.012em",
            color: P.labelColor,
            lineHeight: "17px",
            userSelect: "none",
          }}
        >
          {label}
        </span>
        <PanelToggle
          on={value}
          onToggle={() => onChange(!value)}
        />
      </button>
      {divider && <RowDivider />}
    </>
  );
}

// ─── Settings row — select ────────────────────────────────────────────────────
function SelectRow({
  label,
  value,
  options,
  onChange,
  divider = true,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
  divider?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const [chipHov, setChipHov] = useState(false);
  const currentLabel =
    options.find((o) => o.id === value)?.label ?? value;

  const cycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = options.findIndex((o) => o.id === value);
    const next = options[(idx + 1) % options.length];
    onChange(next.id);
  };

  return (
    <>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="w-full flex items-center"
        style={{
          padding: "0 16px",
          height: 35,
          background: hov ? P.rowHoverBg : "transparent",
          transition: "background 0.1s",
        }}
      >
        <span
          className="flex-1"
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.012em",
            color: P.labelColor,
            lineHeight: "17px",
            userSelect: "none",
          }}
        >
          {label}
        </span>
        <button
          onClick={cycle}
          onMouseEnter={() => setChipHov(true)}
          onMouseLeave={() => setChipHov(false)}
          className="flex items-center cursor-pointer shrink-0"
          style={{
            height: 22,
            padding: "0 8px",
            borderRadius: 7,
            border: `1px solid ${P.selectBorder}`,
            background: chipHov ? P.selectHoverBg : P.selectBg,
            gap: 4,
            transition: "background 0.1s",
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 450,
              letterSpacing: "-0.01em",
              color: P.labelSecondary,
              userSelect: "none",
            }}
          >
            {currentLabel}
          </span>
          <ChevronDown
            size={9}
            strokeWidth={2}
            style={{ color: P.mutedColor, flexShrink: 0 }}
          />
        </button>
      </div>
      {divider && <RowDivider />}
    </>
  );
}

// ─── Settings row — segmented control ────────────────────────────────────────
function SegmentedRow({
  label,
  value,
  options,
  onChange,
  divider = true,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
  divider?: boolean;
}) {
  const [hov, setHov] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="w-full flex items-center"
        style={{
          padding: "0 16px",
          height: 35,
          background: hov ? P.rowHoverBg : "transparent",
          transition: "background 0.1s",
        }}
      >
        <span
          className="flex-1"
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.012em",
            color: P.labelColor,
            userSelect: "none",
          }}
        >
          {label}
        </span>
        <div
          className="flex items-center shrink-0"
          style={{
            background: P.segBg,
            borderRadius: 8,
            padding: 2,
            gap: 1,
          }}
        >
          {options.map((opt) => {
            const active = value === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange(opt.id)}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  height: 18,
                  padding: "0 8px",
                  borderRadius: 6,
                  border: "none",
                  background: active
                    ? P.segActiveBg
                    : "transparent",
                  boxShadow: active
                    ? P.segActiveShadow
                    : "none",
                  transition:
                    "background 0.12s, box-shadow 0.12s",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: active ? 500 : 400,
                    letterSpacing: "-0.01em",
                    color: active ? P.labelColor : P.valueColor,
                    userSelect: "none",
                    transition: "color 0.12s",
                  }}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {divider && <RowDivider />}
    </>
  );
}

// ─── Settings row — action (navigational) ────────────────────────────────────
function ActionRow({
  label,
  sublabel,
  onClick,
  destructive,
  divider = true,
}: {
  label: string;
  sublabel?: string;
  onClick?: () => void;
  destructive?: boolean;
  divider?: boolean;
}) {
  const [hov, setHov] = useState(false);

  return (
    <>
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="w-full flex items-center cursor-pointer"
        style={{
          padding: "0 16px",
          height: 35,
          background: hov ? P.rowHoverBg : "transparent",
          border: "none",
          gap: 8,
          transition: "background 0.1s",
        }}
      >
        <div
          className="flex-1 text-left flex flex-col"
          style={{ gap: 1 }}
        >
          <span
            style={{
              fontSize: 13,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.012em",
              color: destructive
                ? hov
                  ? P.destructiveColor
                  : "#C85878"
                : P.labelColor,
              lineHeight: "17px",
              userSelect: "none",
              transition: "color 0.1s",
            }}
          >
            {label}
          </span>
          {sublabel && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 400,
                color: P.mutedColor,
                letterSpacing: "-0.005em",
                userSelect: "none",
              }}
            >
              {sublabel}
            </span>
          )}
        </div>
        <ChevronRight
          size={13}
          strokeWidth={1.7}
          style={{
            color: P.chevronColor,
            flexShrink: 0,
          }}
        />
      </button>
      {divider && <RowDivider />}
    </>
  );
}

// ─── Settings row — info (read-only) ─────────────────────────────────────────
function InfoRow({
  label,
  value,
  divider = true,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <>
      <div
        className="w-full flex items-center"
        style={{ padding: "0 16px", height: 35 }}
      >
        <span
          className="flex-1"
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.012em",
            color: P.labelColor,
            userSelect: "none",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: P.valueColor,
            userSelect: "none",
          }}
        >
          {value}
        </span>
      </div>
      {divider && <RowDivider />}
    </>
  );
}

// ─── Panel header ─────────────────────────────────────────────────────────────
function PanelHeader({
  title,
  onClose,
  onBack,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  const [closeHov, setCloseHov] = useState(false);
  const [backHov, setBackHov] = useState(false);

  return (
    <div
      className="flex items-center shrink-0"
      style={{
        height: 44,
        padding: "0 8px 0 10px",
        borderBottom: `1px solid ${P.divider}`,
        gap: 2,
      }}
    >
      {/* Back — only in Settings view */}
      {onBack && (
        <button
          onClick={onBack}
          onMouseEnter={() => setBackHov(true)}
          onMouseLeave={() => setBackHov(false)}
          className="flex items-center justify-center shrink-0 cursor-pointer"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "none",
            background: backHov ? P.ctrlHoverBg : "transparent",
            transition: "background 0.12s",
          }}
        >
          <ArrowLeft
            size={13}
            strokeWidth={1.9}
            style={{
              color: backHov ? "#4A4A54" : "#A4A4AE",
              transition: "color 0.12s",
            }}
          />
        </button>
      )}

      {/* Title */}
      <span
        className="flex-1"
        style={{
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "-0.018em",
          color: P.titleColor,
          userSelect: "none",
          paddingLeft: onBack ? 2 : 4,
        }}
      >
        {title}
      </span>

      {/* Close */}
      <button
        onClick={onClose}
        onMouseEnter={() => setCloseHov(true)}
        onMouseLeave={() => setCloseHov(false)}
        className="flex items-center justify-center shrink-0 cursor-pointer"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "none",
          background: closeHov ? P.ctrlHoverBg : "transparent",
          transition: "background 0.12s",
        }}
      >
        <X
          size={13}
          strokeWidth={1.9}
          style={{
            color: closeHov ? "#4A4A54" : "#A4A4AE",
            transition: "color 0.12s",
          }}
        />
      </button>
    </div>
  );
}

// ─── Settings state ───────────────────────────────────────────────────────────
// ─── Account row ──────────────────────────────────────────────────────────────
function AccountRow() {
  const [loginHov, setLoginHov] = useState(false);

  return (
    <div
      className="flex items-center"
      style={{ padding: "10px 16px 12px", gap: 10 }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, #A8B8C4 0%, #8A9BAB 100%)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "0.01em",
            userSelect: "none",
          }}
        >
          G
        </span>
      </div>

      {/* Identity */}
      <div
        className="flex flex-col flex-1 min-w-0"
        style={{ gap: 2 }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.012em",
            color: P.titleColor,
            lineHeight: "16px",
            userSelect: "none",
          }}
        >
          Guest User
        </span>
        <span
          style={{
            fontSize: 11.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.005em",
            color: P.valueColor,
            lineHeight: "14px",
            userSelect: "none",
          }}
        >
          Not logged in
        </span>
      </div>

      {/* Log in — calm action */}
      <button
        onMouseEnter={() => setLoginHov(true)}
        onMouseLeave={() => setLoginHov(false)}
        className="flex items-center justify-center cursor-pointer shrink-0"
        style={{
          height: 26,
          padding: "0 11px",
          borderRadius: 8,
          border: `1px solid ${loginHov ? "#C4CBD2" : "#D8DDE3"}`,
          background: loginHov ? "#F2F6F9" : "#F7F9FB",
          transition: "all 0.14s",
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 520,
            letterSpacing: "-0.008em",
            color: loginHov ? "#3A6A88" : "#527A94",
            userSelect: "none",
            transition: "color 0.14s",
          }}
        >
          Log in
        </span>
      </button>
    </div>
  );
}

// ─── Full-width select control ────────────────────────────────────────────────
function SelectControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ padding: "0 16px 2px" }}>
      <div
        className="relative flex items-center"
        style={{
          height: 32,
          borderRadius: 8,
          border: `1px solid ${P.selectBorder}`,
          background: P.selectBg,
          overflow: "hidden",
        }}
      >
        {/* Invisible native select for interaction */}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {/* Displayed value */}
        <span
          style={{
            flex: 1,
            paddingLeft: 10,
            fontSize: 12.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: P.titleColor,
            userSelect: "none",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {options.find((o) => o.id === value)?.label ?? value}
        </span>
        {/* Chevron overlay */}
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            paddingRight: 10,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <ChevronDown
            size={11}
            strokeWidth={1.8}
            style={{ color: P.mutedColor }}
          />
        </span>
      </div>
    </div>
  );
}

// ─── Color swatch row ─────────────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="flex items-center"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "0 16px",
        height: 40,
        gap: 10,
        background: hov ? P.rowHoverBg : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Clickable color swatch */}
      <label
        className="flex items-center justify-center shrink-0 cursor-pointer"
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          background: value,
          boxShadow: `0 0 0 1.5px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.12)`,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
        title={`Change ${label} color`}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: "absolute",
            opacity: 0,
            width: "200%",
            height: "200%",
            cursor: "pointer",
          }}
        />
      </label>

      {/* Label */}
      <span
        className="flex-1"
        style={{
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.012em",
          color: P.labelColor,
          userSelect: "none",
        }}
      >
        {label}
      </span>

      {/* Hex value chip */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 20,
          padding: "0 7px",
          borderRadius: 5,
          background: "#F2F2F4",
          fontSize: 11,
          fontFamily:
            "'SF Mono', 'Roboto Mono', 'Menlo', monospace",
          fontWeight: 500,
          letterSpacing: "0.03em",
          color: "#6A6A74",
          userSelect: "none",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toUpperCase()}
      </span>
    </div>
  );
}

// ─── Reset to default — secondary ghost action ────────────────────────────────
function ResetDefaultBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <div style={{ padding: "6px 16px 4px" }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="w-full flex items-center justify-center cursor-pointer"
        style={{
          height: 28,
          borderRadius: 8,
          border: `1px solid ${hov ? P.ctrlHoverBorder : P.ctrlBorder}`,
          background: hov ? P.ctrlHoverBg : "transparent",
          transition: "all 0.12s",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 450,
            letterSpacing: "-0.01em",
            color: hov ? P.titleColor : P.labelSecondary,
            userSelect: "none",
            transition: "color 0.12s",
          }}
        >
          Reset to Default
        </span>
      </button>
    </div>
  );
}

// ─── Destructive action row ───────────────────────────────────────────────────
function DestructiveRow({
  label,
  sublabel,
  onClick,
}: {
  label: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-full flex items-center cursor-pointer"
      style={{
        padding: sublabel ? "9px 16px 10px" : "0 16px",
        height: sublabel ? "auto" : 38,
        background: hov
          ? "rgba(185,60,48,0.045)"
          : "transparent",
        border: "none",
        gap: 8,
        transition: "background 0.12s",
        textAlign: "left",
      }}
    >
      <div
        className="flex flex-col flex-1 text-left"
        style={{ gap: 3 }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.012em",
            color: hov ? "#A83428" : P.destructiveRest,
            lineHeight: "17px",
            userSelect: "none",
            transition: "color 0.12s",
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              color: "#A0A0AA",
              letterSpacing: "-0.005em",
              lineHeight: "14px",
              userSelect: "none",
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
      <ChevronRight
        size={13}
        strokeWidth={1.7}
        style={{
          color: hov ? "#B84040" : "#D4A0A0",
          flexShrink: 0,
          transition: "color 0.12s",
        }}
      />
    </button>
  );
}

// ─── Settings state ───────────────────────────────────────────────────────────
interface SettingsState {
  language: string;
  searchEngine: string;
  dailyColor: string;
  learningColor: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  language: "en",
  searchEngine: "google",
  dailyColor: "#c2410c",
  learningColor: "#1d4ed8",
};

const DEFAULT_COLORS = {
  dailyColor: "#c2410c",
  learningColor: "#1d4ed8",
};

// ─── Settings panel ───────────────────────────────────────────────────────────
function SettingsContent({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const [s, setS] = useState<SettingsState>(DEFAULT_SETTINGS);
  const set = <K extends keyof SettingsState>(
    key: K,
    val: SettingsState[K],
  ) => setS((prev) => ({ ...prev, [key]: val }));
  const { showToast } = useToast();

  return (
    <div
      className="flex flex-col"
      style={{
        width: 300,
        background: P.panelBg,
        borderRadius: P.panelRadius,
        border: `1px solid ${P.panelBorder}`,
        boxShadow: P.panelShadow,
        overflow: "hidden",
      }}
    >
      <PanelHeader
        title="Settings"
        onClose={onClose}
        onBack={onBack}
      />

      <div
        className="overflow-y-auto"
        style={{
          maxHeight: "calc(100vh - 120px)",
          scrollbarWidth: "none",
        }}
      >
        {/* ── Account ── */}
        <SectionLabel label="Account" />
        <AccountRow />

        {/* ── Language ── */}
        <div
          style={{
            height: 1,
            background: P.divider,
            margin: "6px 0 0",
          }}
        />
        <SectionLabel label="Language" />
        <SelectControl
          value={s.language}
          options={[
            { id: "en", label: "English" },
            { id: "zh", label: "中文" },
            { id: "ja", label: "日本語" },
            { id: "fr", label: "Français" },
            { id: "de", label: "Deutsch" },
            { id: "es", label: "Español" },
          ]}
          onChange={(v) => set("language", v)}
        />

        {/* ── Search Engine ── */}
        <div
          style={{
            height: 1,
            background: P.divider,
            margin: "10px 0 0",
          }}
        />
        <SectionLabel label="Search Engine" />
        <SelectControl
          value={s.searchEngine}
          options={[
            { id: "google", label: "Google" },
            { id: "duckduckgo", label: "DuckDuckGo" },
            { id: "bing", label: "Bing" },
            { id: "brave", label: "Brave Search" },
          ]}
          onChange={(v) => set("searchEngine", v)}
        />

        {/* ── Theme Colors ── */}
        <div
          style={{
            height: 1,
            background: P.divider,
            margin: "10px 0 0",
          }}
        />
        <SectionLabel label="Theme Colors" />
        <ColorRow
          label="Daily Mode"
          value={s.dailyColor}
          onChange={(v) => set("dailyColor", v)}
        />
        <RowDivider />
        <ColorRow
          label="Learning Mode"
          value={s.learningColor}
          onChange={(v) => set("learningColor", v)}
        />
        <ResetDefaultBtn
          onClick={() =>
            setS((prev) => ({
              ...prev,
              dailyColor: DEFAULT_COLORS.dailyColor,
              learningColor: DEFAULT_COLORS.learningColor,
            }))
          }
        />

        {/* ── Data ── */}
        <div
          style={{
            height: 1,
            background: P.divider,
            margin: "6px 0 0",
          }}
        />
        <SectionLabel label="Data" />
        <DestructiveRow
          label="Clear Browsing Data"
          sublabel="History, cookies, and cache"
          onClick={() => {
            showToast({
              type: "success",
              title: "Browsing data cleared",
              message: "History, cookies, and cache removed.",
            });
          }}
        />

        <div style={{ height: 10 }} />
      </div>
    </div>
  );
}

// ─── Menu item ────────────────────────────────────────────────────────────────
interface MenuItemDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  chevron?: boolean;
  dividerBefore?: boolean;
}

function MenuItem({
  item,
  onClick,
}: {
  item: MenuItemDef;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-full flex items-center cursor-pointer"
      style={{
        padding: "0 14px",
        height: 38,
        background: hov ? P.rowHoverBg : "transparent",
        border: "none",
        gap: 10,
        transition: "background 0.1s",
      }}
    >
      {/* Icon chip */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: P.iconBg,
          color: P.iconColor,
        }}
      >
        {item.icon}
      </span>

      {/* Label */}
      <span
        className="flex-1 text-left"
        style={{
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.013em",
          color: P.labelColor,
          lineHeight: "18px",
          userSelect: "none",
        }}
      >
        {item.label}
      </span>

      {/* Chevron */}
      {item.chevron && (
        <ChevronRight
          size={13}
          strokeWidth={1.7}
          style={{ color: P.chevronColor, flexShrink: 0 }}
        />
      )}
    </button>
  );
}

// ─── Menu panel ───────────────────────────────────────────────────────────────
function MenuContent({
  onClose,
  onNewTab,
  onOpenModal,
  onOpenSettings,
}: {
  onClose: () => void;
  onNewTab?: () => void;
  onOpenModal?: (id: string) => void;
  onOpenSettings: () => void;
}) {
  const MENU_ITEMS: MenuItemDef[] = [
    {
      id: "new-tab",
      label: "New Tab",
      icon: <Plus size={12} strokeWidth={2} />,
    },
    {
      id: "history",
      label: "History",
      icon: <History size={12} strokeWidth={1.8} />,
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: <Bookmark size={12} strokeWidth={1.8} />,
    },
    {
      id: "smart-notes",
      label: "Smart Notes",
      icon: <Sparkles size={12} strokeWidth={1.8} />,
    },
    {
      id: "downloads",
      label: "Downloads",
      icon: <Download size={12} strokeWidth={1.8} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={12} strokeWidth={1.8} />,
      chevron: true,
      dividerBefore: true,
    },
  ];

  const handleItem = (id: string) => {
    if (id === "new-tab") {
      onNewTab?.();
      onClose();
    } else if (id === "history") {
      onOpenModal?.("History");
      onClose();
    } else if (id === "bookmarks") {
      onOpenModal?.("Bookmarks");
      onClose();
    } else if (id === "smart-notes") {
      onOpenModal?.("Smart Notes");
      onClose();
    } else if (id === "settings") {
      onOpenSettings();
    }
  };

  return (
    <div
      className="flex flex-col"
      style={{
        width: 264,
        background: P.panelBg,
        borderRadius: P.panelRadius,
        border: `1px solid ${P.panelBorder}`,
        boxShadow: P.panelShadow,
        overflow: "hidden",
      }}
    >
      <PanelHeader title="Menu" onClose={onClose} />

      {/* Items */}
      <div style={{ padding: "6px 0 8px" }}>
        {MENU_ITEMS.map((item) => (
          <div key={item.id}>
            {item.dividerBefore && (
              <div
                style={{
                  height: 1,
                  background: P.divider,
                  margin: "6px 14px",
                }}
              />
            )}
            <MenuItem
              item={item}
              onClick={() => handleItem(item.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated panel shell ─────────────────────────────────────────────────────
function AnimatedPanel({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(-6px) scale(0.98)",
        transition: "opacity 0.16s ease, transform 0.16s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

// ─── Top-right menu root ──────────────────────────────────────────────────────
export interface TopRightMenuProps {
  open: boolean;
  onClose: () => void;
  onNewTab?: () => void;
  onOpenModal?: (id: string) => void;
}

export function TopRightMenu({
  open,
  onClose,
  onNewTab,
  onOpenModal,
}: TopRightMenuProps) {
  const [view, setView] = useState<"menu" | "settings">("menu");
  const [animVisible, setAnimVisible] = useState(false);

  // Sync animation with open state
  // We track open -> true: trigger mount + anim in. open -> false: anim out.
  const [mounted, setMounted] = useState(false);

  // When open changes
  const prevOpenRef = React.useRef(open);

  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      setMounted(true);
      setView("menu");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimVisible(true));
      });
    } else if (!open && prevOpenRef.current) {
      setAnimVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setView("menu");
      }, 180);
      return () => clearTimeout(t);
    }
    prevOpenRef.current = open;
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop — clicking outside closes */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
        }}
      />

      {/* Panel — layered above backdrop */}
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          zIndex: 901,
        }}
      >
        <AnimatedPanel visible={animVisible}>
          {view === "menu" ? (
            <MenuContent
              onClose={onClose}
              onNewTab={onNewTab}
              onOpenModal={onOpenModal}
              onOpenSettings={() => setView("settings")}
            />
          ) : (
            <SettingsContent
              onClose={onClose}
              onBack={() => setView("menu")}
            />
          )}
        </AnimatedPanel>
      </div>
    </>
  );
}