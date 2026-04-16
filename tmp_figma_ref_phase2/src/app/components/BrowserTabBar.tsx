import { useState } from "react";
import { X, Plus } from "lucide-react";

interface Tab {
  id: string;
  title: string;
  favicon?: string;
}

interface BrowserTabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onNewTab: () => void;
}

const STRIP_BG     = "#EEEEF1";
const STRIP_BORDER = "#DCDCDF";
const ACTIVE_BG    = "#FFFFFF";
const TOOLBAR_BG   = "#FFFFFF";

// The foot radius — how wide the concave "fillet" spreads on each side
const R = 10;

/**
 * Renders the full tab shape as an SVG background.
 * The shape: flat bottom with concave inverse fillets on each side,
 * smoothly curving up into rounded top corners, like a hill rising from flat ground.
 */
function ActiveTabShape({ width, height }: { width: number; height: number }) {
  // Key points:
  // Bottom-left foot starts at (-R, height) on the strip surface
  // Curves concavely up to (0, ~0+topR) then rounds into the top
  // Mirror on the right side
  const topR = 6; // top corner radius

  // Path:
  // Start bottom-left foot on the strip
  // M -R, H  (strip level, left foot)
  // concave curve from strip level up to tab left edge
  // C control points to create the smooth inverse fillet
  // straight up the left side
  // round top-left corner
  // straight across top
  // round top-right corner
  // straight down right side
  // concave curve from tab right edge down to strip level (right foot)

  const H = height;
  const W = width;

  const d = [
    // Start at far left foot (on the strip surface)
    `M ${-R},${H}`,
    // Concave curve: from strip level, curving into the tab's left wall
    // We go from (-R, H) to (0, H * 0.3) with a smooth S-like transition
    `C ${-R},${H - R * 0.0} ${-R * 0.05},${H} ${0},${H - R}`,
    // Up the left side to near the top
    `L ${0},${topR}`,
    // Top-left rounded corner
    `Q ${0},${0} ${topR},${0}`,
    // Across the top
    `L ${W - topR},${0}`,
    // Top-right rounded corner
    `Q ${W},${0} ${W},${topR}`,
    // Down the right side
    `L ${W},${H - R}`,
    // Concave curve: from tab's right wall back to strip level
    `C ${W + R * 0.05},${H} ${W + R},${H - R * 0.0} ${W + R},${H}`,
    // Close (fills the bottom — but we'll cover it with the toolbar white)
    `Z`,
  ].join(" ");

  return (
    <svg
      style={{
        position: "absolute",
        left: -R,
        top: 0,
        width: W + R * 2,
        height: H,
        pointerEvents: "none",
      }}
      viewBox={`${-R} 0 ${W + R * 2} ${H}`}
    >
      {/* Clip to hide the bottom portion of the stroke */}
      <defs>
        <clipPath id={`tab-clip-${W}`}>
          <rect x={-R - 1} y={-1} width={W + R * 2 + 2} height={H + 0.5} />
        </clipPath>
      </defs>
      {/* Fill */}
      <path d={d} fill={ACTIVE_BG} />
      {/* White rect to cover the container's border-bottom underneath */}
      <rect x={0} y={H - 2} width={W} height={2} fill={ACTIVE_BG} />
      {/* Border stroke — clipped so bottom endpoints don't show */}
      <path
        d={[
          `M ${-R},${H}`,
          `C ${-R},${H - R * 0.0} ${-R * 0.05},${H} ${0},${H - R}`,
          `L ${0},${topR}`,
          `Q ${0},${0} ${topR},${0}`,
          `L ${W - topR},${0}`,
          `Q ${W},${0} ${W},${topR}`,
          `L ${W},${H - R}`,
          `C ${W + R * 0.05},${H} ${W + R},${H - R * 0.0} ${W + R},${H}`,
        ].join(" ")}
        fill="none"
        stroke={STRIP_BORDER}
        strokeWidth={1}
        strokeLinejoin="round"
        clipPath={`url(#tab-clip-${W})`}
      />
    </svg>
  );
}

export function BrowserTabBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
}: BrowserTabBarProps) {
  const [hoveredTab, setHoveredTab]     = useState<string | null>(null);
  const [hoveredClose, setHoveredClose] = useState<string | null>(null);
  const [tabWidths, setTabWidths]       = useState<Record<string, number>>({});
  const TAB_HEIGHT = 34;
  const STRIP_HEIGHT = TAB_HEIGHT + 8; // fixed total strip height

  const measureRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      const w = el.offsetWidth;
      setTabWidths((prev) => (prev[id] === w ? prev : { ...prev, [id]: w }));
    }
  };

  return (
    <div
      className="flex items-end"
      style={{
        height: STRIP_HEIGHT,
        background: STRIP_BG,
        borderBottom: `1px solid ${STRIP_BORDER}`,
        padding: "0 10px",
        gap: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {tabs.map((tab) => {
        const isActive  = tab.id === activeTabId;
        const isHovered = hoveredTab === tab.id && !isActive;

        return (
          <div
            key={tab.id}
            ref={measureRef(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            onClick={() => onTabClick(tab.id)}
            className="relative flex items-center gap-2 cursor-pointer transition-all duration-100"
            style={{
              minWidth: 128,
              maxWidth: 204,
              height: TAB_HEIGHT,
              padding: "0 10px",
              marginLeft: isActive ? R : 1,
              marginRight: isActive ? R : 1,
              background: isActive
                ? "transparent"
                : isHovered
                ? "rgba(255,255,255,0.50)"
                : "transparent",
              borderRadius: isActive ? 0 : "7px 7px 0 0",
              zIndex: isActive ? 2 : 1,
            }}
          >
            {/* The organic tab shape — only for the active tab */}
            {isActive && tabWidths[tab.id] && (
              <ActiveTabShape
                width={tabWidths[tab.id]}
                height={TAB_HEIGHT}
              />
            )}

            {/* Title */}
            <span
              className="flex-1 truncate relative"
              style={{
                fontSize: 12,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: isActive ? 500 : 400,
                letterSpacing: "-0.01em",
                color: isActive
                  ? "#1F2023"
                  : isHovered
                  ? "#6F7278"
                  : "#9EA2A8",
                transition: "color 0.1s",
                userSelect: "none",
                zIndex: 1,
              }}
            >
              {tab.title}
            </span>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              onMouseEnter={() => setHoveredClose(tab.id)}
              onMouseLeave={() => setHoveredClose(null)}
              className="shrink-0 flex items-center justify-center rounded-[4px] transition-all duration-100 relative"
              style={{
                width: 16,
                height: 16,
                opacity: isActive || isHovered ? 1 : 0,
                color: hoveredClose === tab.id ? "#1F2023" : "#9EA2A8",
                background: hoveredClose === tab.id
                  ? "#E4E4E7"
                  : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.1s, background 0.1s, color 0.1s",
                zIndex: 1,
              }}
            >
              <X size={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}

      {/* New tab button */}
      <button
        onClick={onNewTab}
        className="flex items-center justify-center rounded-md transition-all duration-100"
        style={{
          width: 26,
          height: 26,
          marginBottom: 3,
          marginLeft: 2,
          color: "#A9ADB4",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#ECECEF";
          (e.currentTarget as HTMLButtonElement).style.color = "#1F2023";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#A9ADB4";
        }}
      >
        <Plus size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}