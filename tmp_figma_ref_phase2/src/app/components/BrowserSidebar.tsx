import { useState } from "react";
import {
  History,
  Bookmark,
  Timer,
  CheckSquare,
  Calendar,
  Cloud,
  Bot,
  Users,
  Sparkles,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useToast } from "./ToastProvider";

// ─── Palette tokens ───────────────────────────────────────────────────────────
const P = {
  sidebarBg:      "#F4F4F5",
  border:         "#E4E4E7",
  divider:        "#E4E4E7",
  activeBg:       "#FFFFFF",
  activeBorder:   "rgba(0,0,0,0.07)",
  activeShadow:   "0 1px 4px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.04)",
  hoverBg:        "#ECECEF",
  textPrimary:    "#1F2023",
  textSecondary:  "#6F7278",
  textTertiary:   "#9EA2A8",
  iconDefault:    "#A9ADB4",
  iconHover:      "#1F2023",
  toggleIcon:     "#A9ADB4",
  toggleHoverBg:  "#ECECEF",
  toggleHoverIcon:"#1F2023",
  brandText:      "#1F2023",
  brandMark:      "#1F2023",
};

// Accent — fires only on active icon chip, 8% opacity bg
const ACCENT: Record<string, { bg: string; color: string }> = {
  "History":      { bg: "rgba(200,138,66,0.08)",  color: "#C88A42" },
  "Bookmarks":    { bg: "rgba(111,160,106,0.08)", color: "#6FA06A" },
  "Pomodoro":     { bg: "rgba(212,107,95,0.08)",  color: "#D46B5F" },
  "Todo List":    { bg: "rgba(111,114,120,0.08)", color: "#6F7278" },
  "Schedule":     { bg: "rgba(125,132,201,0.08)", color: "#7D84C9" },
  "Weather":      { bg: "rgba(123,155,179,0.08)", color: "#7B9BB3" },
  "AI Assistant": { bg: "rgba(154,132,214,0.08)", color: "#9A84D6" },
  "Chat Room":    { bg: "rgba(95,160,141,0.08)",  color: "#5FA08D" },
  "Smart Notes":  { bg: "rgba(122,144,155,0.08)", color: "#7A909B" },
  "Daily Mode":   { bg: "rgba(210,155,69,0.08)",  color: "#D29B45" },
};

// ─── Nav row ─────────────────────────────────────────────────────────────────
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  const [hovered, setHovered] = useState(false);
  const accent = ACCENT[label] ?? { bg: "rgba(110,114,107,0.08)", color: "#6E726B" };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center text-left transition-all duration-100 cursor-pointer"
      style={{
        gap: 8,
        padding: "5px 7px",
        borderRadius: 8,
        background: active ? P.activeBg : hovered ? P.hoverBg : "transparent",
        border: active ? `1px solid ${P.activeBorder}` : "1px solid transparent",
        boxShadow: active ? P.activeShadow : "none",
      }}
    >
      {/* Icon — chip only on active, bare on rest/hover */}
      {active ? (
        <span
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 20, height: 20,
            borderRadius: 5,
            background: accent.bg,
            color: accent.color,
          }}
        >
          {icon}
        </span>
      ) : (
        <span
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 20, height: 20,
            color: hovered ? P.iconHover : P.iconDefault,
            transition: "color 0.1s",
          }}
        >
          {icon}
        </span>
      )}

      {/* Label */}
      <span
        style={{
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: active ? 500 : 400,
          letterSpacing: "-0.013em",
          lineHeight: "18px",
          color: active ? P.textPrimary : hovered ? P.textPrimary : P.textSecondary,
          transition: "color 0.1s",
          userSelect: "none",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ height: 1, background: P.divider, margin: "5px 2px" }} />
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconButton({
  onClick,
  children,
  size = 28,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-lg transition-all duration-100"
      style={{
        width: size, height: size,
        color: P.toggleIcon,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = P.toggleHoverBg;
        (e.currentTarget as HTMLButtonElement).style.color = P.toggleHoverIcon;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = P.toggleIcon;
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface BrowserSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenModal?: (id: string) => void;
}

export function BrowserSidebar({ collapsed, onToggle, onOpenModal }: BrowserSidebarProps) {
  const [activeItem, setActiveItem] = useState("History");
  const { showToast } = useToast();

  const topItems = [
    { id: "History",   icon: <History size={14} strokeWidth={1.75} />,     label: "History" },
    { id: "Bookmarks", icon: <Bookmark size={14} strokeWidth={1.75} />,    label: "Bookmarks" },
    { id: "Pomodoro",  icon: <Timer size={14} strokeWidth={1.75} />,       label: "Pomodoro" },
    { id: "Todo List", icon: <CheckSquare size={14} strokeWidth={1.75} />, label: "Todo List" },
    { id: "Schedule",  icon: <Calendar size={14} strokeWidth={1.75} />,    label: "Schedule" },
    { id: "Weather",   icon: <Cloud size={14} strokeWidth={1.75} />,       label: "Weather" },
  ];

  const workspaceItems = [
    { id: "AI Assistant", icon: <Bot size={14} strokeWidth={1.75} />,      label: "AI Assistant" },
    { id: "Chat Room",    icon: <Users size={14} strokeWidth={1.75} />,    label: "Chat Room" },
    { id: "Smart Notes",  icon: <Sparkles size={14} strokeWidth={1.75} />, label: "Smart Notes" },
  ];

  const dailyItems = [
    { id: "Daily Mode", icon: <Sun size={14} strokeWidth={1.75} />, label: "Study Mode" },
  ];

  const MODAL_TOOLS = new Set(["History", "Bookmarks", "Pomodoro", "AI Assistant", "Smart Notes"]);

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center h-full"
        style={{
          width: 52,
          background: P.sidebarBg,
          borderRight: `1px solid ${P.border}`,
          paddingTop: 12,
        }}
      >
        <IconButton onClick={onToggle} size={32}>
          <PanelLeftOpen size={15} strokeWidth={1.6} />
        </IconButton>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 178,
        background: P.sidebarBg,
        borderRight: `1px solid ${P.border}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "12px 8px 10px 12px",
        }}
      >
        <div className="flex items-center gap-[9px]">
          <span
            style={{
              fontSize: 13,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              color: P.brandText,
              letterSpacing: "-0.026em",
              lineHeight: 1,
            }}
          >
            Anechoic
          </span>
        </div>
        <IconButton onClick={onToggle} size={28}>
          <PanelLeftClose size={14} strokeWidth={1.6} />
        </IconButton>
      </div>

      {/* Nav groups */}
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ padding: "2px 5px 8px" }}
      >
        <div className="flex flex-col" style={{ gap: 1 }}>
          {topItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              onClick={() => {
                setActiveItem(item.id);
                if (MODAL_TOOLS.has(item.id)) onOpenModal?.(item.id);
              }}
            />
          ))}
        </div>
        <Divider />
        <div className="flex flex-col" style={{ gap: 1 }}>
          {workspaceItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              onClick={() => {
                setActiveItem(item.id);
                if (MODAL_TOOLS.has(item.id)) onOpenModal?.(item.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom pinned */}
      <div style={{ borderTop: `1px solid ${P.divider}`, padding: "5px 5px 10px" }}>
        {dailyItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            onClick={() => {
              const isActivating = activeItem !== item.id;
              setActiveItem(item.id);
              if (isActivating) {
                showToast({
                  type: "info",
                  title: "Study Mode",
                  message: "Focus mode activated.",
                  duration: 2400,
                });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}