import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  Bookmark,
  AlignJustify,
} from "lucide-react";
import { TopRightMenu } from "./TopRightMenu";

// ─── Palette tokens ───────────────────────────────────────────────────────────
// Toolbar is the primary white lifted surface in the shell
const P = {
  toolbarBg:        "#FFFFFF",
  toolbarBorder:    "#E4E4E7",

  // Address bar — soft inset glass field at rest, white card on focus
  fieldBgRest:      "rgba(243,243,245,0.90)",
  fieldBorderRest:  "#D8D8DD",
  fieldShadowRest:  "inset 0 1px 2px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.9)",
  fieldBgFocus:     "#FFFFFF",
  fieldBorderFocus: "#9EA2A8",
  fieldShadowFocus: "0 0 0 3px rgba(158,162,168,0.15), 0 1px 3px rgba(0,0,0,0.06)",

  urlText:          "#1F2023",
  lockIconRest:     "#A9ADB4",
  lockIconFocus:    "#6F7278",

  iconDefault:      "#6F7278",
  iconHover:        "#1F2023",
  iconDisabled:     "#A9ADB4",
  iconHoverBg:      "#ECECEF",

  separator:        "#E4E4E7",
};

// ─── Nav icon button ──────────────────────────────────────────────────────────
interface NavButtonProps {
  icon: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}

function NavButton({ icon, disabled, onClick, title }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center transition-all duration-100"
      style={{
        width: 32, height: 32,
        borderRadius: 10,
        color: disabled ? P.iconDisabled : P.iconDefault,
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = P.iconHoverBg;
          (e.currentTarget as HTMLButtonElement).style.color = P.iconHover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = P.iconDefault;
        }
      }}
    >
      {icon}
    </button>
  );
}

// ─── Zone separator ───────────────────────────────────────────────────────────
function ToolbarRule() {
  return (
    <div
      style={{
        width: 1, height: 16,
        background: P.separator,
        flexShrink: 0,
        margin: "0 3px",
      }}
    />
  );
}

// ─── Bookmark button — stateful, consistent with NavButton ────────────────────
interface BookmarkButtonProps {
  bookmarked: boolean;
  onToggle: () => void;
}

function BookmarkButton({ bookmarked, onToggle }: BookmarkButtonProps) {
  const [hov, setHov] = useState(false);

  const iconColor = bookmarked
    ? hov ? "#2E7A54" : "#3D8A64"
    : hov ? P.iconHover : P.iconDefault;

  const bgColor = bookmarked
    ? hov ? "rgba(52,130,90,0.13)" : "rgba(52,130,90,0.08)"
    : hov ? P.iconHoverBg : "transparent";

  return (
    <button
      onClick={onToggle}
      title={bookmarked ? "Remove bookmark" : "Bookmark this page"}
      className="flex items-center justify-center"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        color: iconColor,
        background: bgColor,
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.1s, color 0.1s",
      }}
    >
      <Bookmark
        size={15}
        strokeWidth={1.7}
        style={{
          fill: bookmarked ? "currentColor" : "none",
          transition: "fill 0.15s, color 0.1s",
        }}
      />
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
interface BrowserNavBarProps {
  url: string;
  onUrlChange: (url: string) => void;
  onNavigate: (url: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onNewTab?: () => void;
  onOpenModal?: (id: string) => void;
}

export function BrowserNavBar({
  url,
  onUrlChange,
  onNavigate,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onRefresh,
  onHome,
  onNewTab,
  onOpenModal,
}: BrowserNavBarProps) {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState(url);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onNavigate(inputValue);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleFocus = () => setFocused(true);
  const handleBlur  = () => {
    setFocused(false);
    setInputValue(url);
  };

  return (
    <div
      className="flex items-center"
      style={{
        background: P.toolbarBg,
        borderBottom: "none",
        boxShadow: "none",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: "0 8px",
        height: 40,
        gap: 4,
      }}
    >
      {/* Left nav controls */}
      <div className="flex items-center shrink-0" style={{ gap: 0 }}>
        <NavButton icon={<ArrowLeft size={15} strokeWidth={1.7} />}  disabled={!canGoBack}    onClick={onBack}    title="Go back" />
        <NavButton icon={<ArrowRight size={15} strokeWidth={1.7} />} disabled={!canGoForward} onClick={onForward} title="Go forward" />
        <NavButton icon={<Home size={15} strokeWidth={1.7} />}                                onClick={onHome}    title="Home" />
        <NavButton icon={<RotateCw size={14} strokeWidth={1.7} />}                            onClick={onRefresh} title="Refresh" />
        <BookmarkButton bookmarked={bookmarked} onToggle={() => setBookmarked((v) => !v)} />
      </div>

      <ToolbarRule />

      {/* Address bar */}
      <div className="flex-1 flex items-center" style={{ padding: "0 2px" }}>
        <div
          className="w-full flex items-center gap-2.5 transition-all duration-150"
          style={{
            background:   focused ? P.fieldBgFocus    : P.fieldBgRest,
            backdropFilter: focused ? undefined : "blur(6px)",
            WebkitBackdropFilter: focused ? undefined : "blur(6px)",
            borderRadius: 16,
            border: `1.5px solid ${focused ? P.fieldBorderFocus : P.fieldBorderRest}`,
            boxShadow:    focused ? P.fieldShadowFocus : P.fieldShadowRest,
            padding:      "0 11px",
            height:       32,
            cursor:       "text",
            transition:   "background 0.15s, border 0.15s, box-shadow 0.15s",
          }}
        >
          <span
            style={{
              color: focused ? P.lockIconFocus : P.lockIconRest,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              transition: "color 0.12s",
            }}
          >
            {focused
              ? <Search size={12} strokeWidth={1.9} />
              : null
            }
          </span>

          <input
            value={focused ? inputValue : url}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter website..."
            className="flex-1 bg-transparent outline-none"
            style={{
              color:         P.urlText,
              fontSize:      12.5,
              fontFamily:    "Inter, system-ui, sans-serif",
              caretColor:    P.urlText,
              letterSpacing: "-0.01em",
            }}
          />
        </div>
      </div>

      <ToolbarRule />

      {/* Right utility actions */}
      <div className="flex items-center shrink-0" style={{ gap: 0 }}>
        {/* Menu button — relative wrapper so panel can be absolutely positioned */}
        <div style={{ position: "relative" }}>
          <NavButton
            icon={<AlignJustify size={15} strokeWidth={1.7} />}
            title="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          />
          <TopRightMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onNewTab={onNewTab}
            onOpenModal={onOpenModal}
          />
        </div>
      </div>
    </div>
  );
}