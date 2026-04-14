import { useState } from "react";
import { Search, Plus } from "lucide-react";

// ─── Palette tokens ───────────────────────────────────────────────────────────
// Canvas is pure white — the dominant reading surface
const P = {
  canvasBg:         "#FFFFFF",

  brandText:        "#1F2023",
  brandMark:        "#1F2023",

  // Search field
  fieldBgRest:      "rgba(255,255,255,0.97)",
  fieldBorderRest:  "#E4E4E7",
  fieldShadowRest:  "inset 0 1px 0 rgba(255,255,255,1), 0 2px 10px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
  fieldBgFocus:     "#FFFFFF",
  fieldBorderFocus: "#9EA2A8",
  fieldShadowFocus: "inset 0 1px 0 rgba(255,255,255,1), 0 0 0 3px rgba(158,162,168,0.15), 0 4px 16px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",

  searchIconRest:   "#9EA2A8",
  searchIconFocus:  "#6F7278",
  inputText:        "#1F2023",

  // Shortcut tiles — white cards
  tileBg:           "#FFFFFF",
  tileBorder:       "#E4E4E7",
  tileShadowRest:   "0 1px 3px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
  tileShadowHover:  "0 4px 16px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
  tileLetterRest:   "#1F2023",
  tileLabelRest:    "#9EA2A8",
  tileLabelHover:   "#6F7278",

  // Add tile
  addDash:          "#D8D8DD",
  addDashHover:     "#A9ADB4",
  addBgHover:       "#ECECEF",
  addIconRest:      "#A9ADB4",
  addIconHover:     "#6F7278",
  addLabelRest:     "#A9ADB4",
  addLabelHover:    "#6F7278",
};

// Tile accent — only fires on hover letter color + 8% tint bg
const TILE_ACCENT: Record<string, { bg: string; color: string }> = {
  google:  { bg: "rgba(200,138,66,0.08)",  color: "#C88A42" },
  canvas:  { bg: "rgba(212,107,95,0.08)",  color: "#D46B5F" },
  youtube: { bg: "rgba(212,107,95,0.08)",  color: "#D46B5F" },
  gmail:   { bg: "rgba(210,155,69,0.08)",  color: "#D29B45" },
};

const TILE_SIZE   = 58;
const TILE_RADIUS = 13;

// ─── Site data ────────────────────────────────────────────────────────────────
interface QuickAccessSite {
  id: string;
  label: string;
  letter: string;
}

const defaultSites: QuickAccessSite[] = [
  { id: "google",  label: "Google",  letter: "G" },
  { id: "canvas",  label: "Canvas",  letter: "C" },
  { id: "youtube", label: "YouTube", letter: "Y" },
  { id: "gmail",   label: "Gmail",   letter: "M" },
];

// ─── Site tile ────────────────────────────────────────────────────────────────
function SiteTile({ site }: { site: QuickAccessSite }) {
  const [hovered, setHovered] = useState(false);
  const accent = TILE_ACCENT[site.id] ?? { bg: "rgba(110,114,107,0.08)", color: "#6E726B" };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center cursor-pointer select-none"
      style={{ gap: 10 }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width:        TILE_SIZE,
          height:       TILE_SIZE,
          background:   hovered ? accent.bg : P.tileBg,
          border:       `1px solid ${hovered ? "transparent" : P.tileBorder}`,
          borderRadius: TILE_RADIUS,
          boxShadow:    hovered ? P.tileShadowHover : P.tileShadowRest,
          transform:    hovered ? "translateY(-2px)" : "translateY(0)",
          transition:   "all 0.18s ease",
        }}
      >
        <span
          style={{
            fontSize:      19,
            fontFamily:    "Inter, system-ui, sans-serif",
            fontWeight:    600,
            letterSpacing: "-0.03em",
            color:         hovered ? accent.color : P.tileLetterRest,
            transition:    "color 0.18s",
          }}
        >
          {site.letter}
        </span>
      </div>

      <span
        style={{
          fontSize:      11,
          fontFamily:    "Inter, system-ui, sans-serif",
          fontWeight:    400,
          color:         hovered ? P.tileLabelHover : P.tileLabelRest,
          letterSpacing: "-0.005em",
          lineHeight:    1,
          transition:    "color 0.18s",
        }}
      >
        {site.label}
      </span>
    </div>
  );
}

// ─── Add tile ─────────────────────────────────────────────────────────────────
function AddTile() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center cursor-pointer select-none"
      style={{ gap: 10 }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width:        TILE_SIZE,
          height:       TILE_SIZE,
          background:   hovered ? P.addBgHover : "transparent",
          border:       `1.5px dashed ${hovered ? P.addDashHover : P.addDash}`,
          borderRadius: TILE_RADIUS,
          transform:    hovered ? "translateY(-2px)" : "translateY(0)",
          transition:   "all 0.18s ease",
        }}
      >
        <Plus
          size={15}
          strokeWidth={1.6}
          style={{
            color:      hovered ? P.addIconHover : P.addIconRest,
            transition: "color 0.18s",
          }}
        />
      </div>
      <span
        style={{
          fontSize:      11,
          fontFamily:    "Inter, system-ui, sans-serif",
          fontWeight:    400,
          color:         hovered ? P.addLabelHover : P.addLabelRest,
          letterSpacing: "-0.005em",
          lineHeight:    1,
          transition:    "color 0.18s",
        }}
      >
        Add
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
interface NewTabPageProps {
  onSearch: (query: string) => void;
}

export function NewTabPage({ onSearch }: NewTabPageProps) {
  const [query, setQuery]     = useState("");
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) onSearch(query.trim());
  };

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center overflow-y-auto"
      style={{ background: P.canvasBg }}
    >
      {/* Brand mark + title */}
      <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
        {/* Abstract descending mark */}
        

        <h1
          style={{
            color:         P.brandText,
            fontSize:      34,
            fontFamily:    "Inter, system-ui, sans-serif",
            fontWeight:    300,
            letterSpacing: "-0.048em",
            margin:        0,
            lineHeight:    1,
          }}
        >
          Anechoic
        </h1>
      </div>

      {/* Search field */}
      <div
        className="flex items-center"
        style={{
          width:        "min(540px, 88%)",
          background:   focused ? P.fieldBgFocus   : P.fieldBgRest,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 11,
          border:       `1.5px solid ${focused ? P.fieldBorderFocus : P.fieldBorderRest}`,
          boxShadow:    focused ? P.fieldShadowFocus : P.fieldShadowRest,
          padding:      "0 18px",
          height:       52,
          gap:          12,
          marginBottom: 36,
          transition:   "background 0.15s, border 0.15s, box-shadow 0.18s",
        }}
      >
        <Search
          size={15}
          strokeWidth={1.8}
          style={{
            color:      focused ? P.searchIconFocus : P.searchIconRest,
            flexShrink: 0,
            transition: "color 0.15s",
          }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search or enter website..."
          className="flex-1 bg-transparent outline-none placeholder-[#9EA2A8]"
          style={{
            color:         P.inputText,
            fontSize:      14,
            fontFamily:    "Inter, system-ui, sans-serif",
            letterSpacing: "-0.01em",
            caretColor:    P.inputText,
          }}
        />
      </div>

      {/* Quick-access tiles */}
      <div className="flex items-start" style={{ gap: 14 }}>
        {defaultSites.map((site) => (
          <SiteTile key={site.id} site={site} />
        ))}
        <AddTile />
      </div>
    </div>
  );
}