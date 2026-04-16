import { useState, useEffect, useRef } from "react";
import { Plus, ExternalLink, X, Link, Sparkles, Trash2 } from "lucide-react";
import { useToast } from "./ToastProvider";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  // Workspace chrome
  chromeBg: "#FAFAFA",
  chromeBorder: "#E8E8EA",

  // Rail
  railBg: "#F6F6F7",
  railBorder: "#E8E8EA",

  // Note item states
  itemSelectedBg: "#FFFFFF",
  itemSelectedBorder: "rgba(0,0,0,0.09)",
  itemSelectedShadow:
    "0 1px 5px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.05)",
  itemHoverBg: "#EEEEEF",

  // Typography
  textPrimary: "#1F2023",
  textSecondary: "#6F7278",
  textTertiary: "#9EA2A8",
  textMuted: "#B4B8BF",
  textBody: "#3C4047",

  // Smart Notes accent — slate
  accent: "#7A909B",
  accentBg: "rgba(122,144,155,0.09)",
  accentBorder: "rgba(122,144,155,0.18)",

  // Canvas
  canvasBg: "#FFFFFF",
  borderLight: "#EFEFEF",
  borderDefault: "#E0E0E3",

  // Control rest-state border (very subtle, always visible)
  ctrlBorder: "#E4E4E7",
  ctrlHoverBg: "#F2F2F4",
  ctrlHoverBorder: "#D8D8DC",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Note {
  id: string;
  title: string;
  preview: string;
  date: string;
  time: string;
  sourceUrl: string;
  sourceDomain: string;
  content: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_NOTES: Note[] = [
  {
    id: "n1",
    title: "zh.wikipedia.org",
    preview: "合数·正约数有1、2、67和134。素因数分解为 2 × 67。",
    date: "2026年4月12日",
    time: "20:09",
    sourceUrl: "https://zh.wikipedia.org/wiki/134",
    sourceDomain: "zh.wikipedia.org",
    content: "合数·正约数有1、2、67和134。\n素因数分解为\n2 × 67\n。",
  },
  {
    id: "n2",
    title: "React Architecture Patterns",
    preview: "Component composition over inheritance, lift state up when…",
    date: "2026年4月11日",
    time: "15:33",
    sourceUrl: "https://react.dev/learn/thinking-in-react",
    sourceDomain: "react.dev",
    content:
      "Component composition over inheritance, lift state up when needed.\n\nThink of the UI as a tree of components. Each component should have a single responsibility.\n\nState should live at the lowest common ancestor of the components that need it.",
  },
  {
    id: "n3",
    title: "Typography principles",
    preview: "Line length should be 60–80 characters for body copy…",
    date: "2026年4月10日",
    time: "11:07",
    sourceUrl: "https://practicaltypography.com",
    sourceDomain: "practicaltypography.com",
    content:
      "Line length should be 60–80 characters for body copy.\nLine spacing: 120–145% of point size.\nUse no more than 2 typefaces per project.\n\nTracking (letter-spacing) should be used sparingly.\nWhitespace communicates structure and priority.",
  },
  {
    id: "n4",
    title: "New Note",
    preview: "Take note...",
    date: "2026年4月12日",
    time: "20:09",
    sourceUrl: "",
    sourceDomain: "",
    content: "",
  },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="shrink-0 cursor-pointer"
      style={{
        width: 26,
        height: 15,
        borderRadius: 8,
        background: on ? T.accent : "#CACACE",
        border: "none",
        padding: 0,
        position: "relative",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: "#FFFFFF",
          display: "block",
          position: "absolute",
          top: 2,
          left: on ? 13 : 2,
          transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.20)",
        }}
      />
    </button>
  );
}

// ─── Chrome control button ────────────────────────────────────────────────────
// Shared ghost-button style for Open and Close — always has a faint border
// so they read as intentional controls, not floating elements.
function ChromeBtn({
  onClick,
  children,
  width,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center justify-center cursor-pointer shrink-0"
      style={{
        height: 26,
        width: width ?? "auto",
        padding: width ? 0 : "0 9px",
        borderRadius: 6,
        border: `1px solid ${hov ? T.ctrlHoverBorder : T.ctrlBorder}`,
        background: hov ? T.ctrlHoverBg : "transparent",
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Workspace Chrome Bar ─────────────────────────────────────────────────────
function WorkspaceChromeBar({
  autoSave,
  onToggleAutoSave,
  onAddNote,
  selectedNote,
  onClose,
  railWidth,
}: {
  autoSave: boolean;
  onToggleAutoSave: () => void;
  onAddNote: () => void;
  selectedNote: Note | null;
  onClose: () => void;
  railWidth: number;
}) {
  const [addHov, setAddHov] = useState(false);
  const [openHov, setOpenHov] = useState(false);
  const hasSource = !!(selectedNote?.sourceUrl);

  return (
    <div
      className="flex items-center shrink-0"
      style={{
        height: 44,
        background: T.chromeBg,
        borderBottom: `1px solid ${T.chromeBorder}`,
      }}
    >
      {/* ── Left zone: identity chip, aligned with rail ── */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: railWidth,
          borderRight: `1px solid ${T.chromeBorder}`,
          height: "100%",
          padding: "0 14px",
        }}
      >
        <span
          className="inline-flex items-center"
          style={{
            height: 22,
            padding: "0 9px",
            borderRadius: 6,
            background: T.accentBg,
            gap: 5,
            border: `1px solid ${T.accentBorder}`,
          }}
        >
          <Sparkles
            size={10}
            strokeWidth={1.8}
            style={{ color: T.accent, flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              letterSpacing: "0.01em",
              color: T.accent,
              userSelect: "none",
            }}
          >
            Smart Notes
          </span>
        </span>
      </div>

      {/* ── Right zone: controls, aligned with reading canvas ── */}
      <div
        className="flex items-center flex-1 min-w-0"
        style={{ padding: "0 16px", height: "100%" }}
      >
        {/* Auto Save toggle group */}
        <div className="flex items-center" style={{ gap: 7 }}>
          <ToggleSwitch on={autoSave} onToggle={onToggleAutoSave} />
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              color: autoSave ? T.textSecondary : T.textMuted,
              lineHeight: "15px",
              userSelect: "none",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            Auto Save Copied Link
          </span>
        </div>

        {/* Thin rule */}
        <div
          style={{
            width: 1,
            height: 13,
            background: T.chromeBorder,
            flexShrink: 0,
            margin: "0 12px",
          }}
        />

        {/* Add Note */}
        <button
          onClick={onAddNote}
          onMouseEnter={() => setAddHov(true)}
          onMouseLeave={() => setAddHov(false)}
          className="flex items-center cursor-pointer shrink-0"
          style={{
            height: 26,
            padding: "0 9px",
            borderRadius: 6,
            border: `1px solid ${addHov ? T.ctrlHoverBorder : T.ctrlBorder}`,
            background: addHov ? T.ctrlHoverBg : "transparent",
            gap: 5,
            transition: "background 0.12s, border-color 0.12s",
          }}
        >
          <Plus
            size={11}
            strokeWidth={2.2}
            style={{
              color: addHov ? T.textSecondary : T.textTertiary,
              flexShrink: 0,
              transition: "color 0.12s",
            }}
          />
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 450,
              letterSpacing: "-0.01em",
              color: addHov ? T.textPrimary : T.textSecondary,
              transition: "color 0.12s",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            Add Note
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Open + Close — grouped right cluster */}
        <div className="flex items-center" style={{ gap: 6 }}>
          {hasSource && (
            <ChromeBtn onClick={undefined}>
              <div
                className="flex items-center"
                style={{ gap: 5 }}
                onMouseEnter={() => setOpenHov(true)}
                onMouseLeave={() => setOpenHov(false)}
              >
                <span
                  style={{
                    fontSize: 11.5,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 450,
                    letterSpacing: "-0.01em",
                    color: openHov ? T.textPrimary : T.textSecondary,
                    transition: "color 0.12s",
                    userSelect: "none",
                  }}
                >
                  Open
                </span>
                <ExternalLink
                  size={10.5}
                  strokeWidth={1.8}
                  style={{
                    color: openHov ? T.textSecondary : T.textTertiary,
                    transition: "color 0.12s",
                    flexShrink: 0,
                  }}
                />
              </div>
            </ChromeBtn>
          )}

          <ChromeBtn onClick={onClose} width={26}>
            <X size={13} strokeWidth={1.75} style={{ color: T.textTertiary }} />
          </ChromeBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Note Item ────────────────────────────────────────────────────────────────
function NoteItem({
  note,
  selected,
  onSelect,
  onDelete,
}: {
  note: Note;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left flex flex-col cursor-pointer"
      style={{
        padding: "9px 10px 10px",
        borderRadius: 7,
        border: selected
          ? `1px solid ${T.itemSelectedBorder}`
          : "1px solid transparent",
        background: selected
          ? T.itemSelectedBg
          : hovered
          ? T.itemHoverBg
          : "transparent",
        boxShadow: selected
          ? `-2px 0 0 0 ${T.accent}, ${T.itemSelectedShadow}`
          : "none",
        gap: 4,
        transition: "background 0.1s, box-shadow 0.12s",
        position: "relative",
      }}
    >
      {/* Title */}
      <span
        style={{
          fontSize: 12.5,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: selected ? 500 : 400,
          letterSpacing: "-0.012em",
          color: selected ? T.textPrimary : hovered ? "#38393E" : "#4A4E56",
          lineHeight: "17px",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          transition: "color 0.1s",
          paddingRight: hovered ? 18 : 0,
        }}
      >
        {note.title}
      </span>

      {/* Preview */}
      <span
        style={{
          fontSize: 11.5,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.005em",
          color: T.textTertiary,
          lineHeight: "15px",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {note.preview}
      </span>

      {/* Date */}
      <span
        style={{
          fontSize: 11,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          color: T.textMuted,
          lineHeight: "14px",
          marginTop: 1,
        }}
      >
        {note.date} · {note.time}
      </span>

      {/* Delete button — appears on hover, top-right */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete note"
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 18,
            height: 18,
            borderRadius: 4,
            border: "none",
            background: "rgba(192,80,64,0.09)",
            color: "#C04848",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Trash2 size={10} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

// ─── Notes Rail ───────────────────────────────────────────────────────────────
function NotesRail({
  notes,
  selectedId,
  onSelect,
  onDelete,
  width,
}: {
  notes: Note[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  width: number;
}) {
  return (
    <div
      className="flex flex-col shrink-0 h-full"
      style={{
        width,
        background: T.railBg,
        borderRight: `1px solid ${T.railBorder}`,
      }}
    >
      {/* Section label */}
      <div style={{ padding: "14px 16px 7px" }}>
        <span
          style={{
            fontSize: 9.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.07em",
            color: "#C4C4C8",
            textTransform: "uppercase",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          Notes
        </span>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "2px 7px 10px", scrollbarWidth: "none" }}
      >
        <div className="flex flex-col" style={{ gap: 2 }}>
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              selected={selectedId === note.id}
              onSelect={() => onSelect(note.id)}
              onDelete={() => onDelete(note.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reading Canvas ───────────────────────────────────────────────────────────
function ReadingCanvas({ note }: { note: Note | null }) {
  if (!note) return null;

  const contentLines = note.content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const hasContent = contentLines.length > 0;

  return (
    <div
      className="flex-1 overflow-y-auto min-w-0"
      style={{ background: T.canvasBg, scrollbarWidth: "none" }}
    >
      <div style={{ padding: "52px 80px 72px 60px" }}>
        <div style={{ maxWidth: 640 }}>

          {/* Source chip */}
          {note.sourceDomain && (
            <div style={{ marginBottom: 20 }}>
              <span
                className="inline-flex items-center"
                style={{
                  height: 20,
                  padding: "0 8px",
                  borderRadius: 5,
                  background: T.accentBg,
                  border: `1px solid ${T.accentBorder}`,
                  gap: 5,
                }}
              >
                <Link
                  size={9}
                  strokeWidth={2}
                  style={{ color: T.accent, flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                    color: T.accent,
                    userSelect: "none",
                  }}
                >
                  {note.sourceDomain}
                </span>
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: 22,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: T.textPrimary,
              lineHeight: "1.30",
              margin: "0 0 6px",
            }}
          >
            {note.title}
          </h1>

          {/* Date / time — close to title, they're a unit */}
          <p
            style={{
              fontSize: 12,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              color: T.textMuted,
              lineHeight: "16px",
              margin: "0 0 22px",
            }}
          >
            {note.date} · {note.time}
          </p>

          {/* Hairline separator */}
          <div
            style={{
              height: 1,
              background: T.borderLight,
              marginBottom: 32,
            }}
          />

          {/* Body */}
          {hasContent ? (
            <div className="flex flex-col" style={{ gap: 14 }}>
              {contentLines.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 14.5,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    color: T.textBody,
                    lineHeight: "1.78",
                    margin: 0,
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p
              style={{
                fontSize: 14.5,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: T.textMuted,
                lineHeight: "1.78",
                margin: 0,
              }}
            >
              Take note...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Slide-out Shell ──────────────────────────────────────────────────────────
interface SmartNotesShellProps {
  open: boolean;
  children: React.ReactNode;
}

function SmartNotesShell({ open, children }: SmartNotesShellProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevOpen = useRef(open);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else if (!open && prevOpen.current) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 280);
      prevOpen.current = false;
      return () => clearTimeout(t);
    }
    prevOpen.current = open;
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#FFFFFF",
        transform: visible ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.30, 0, 0.18, 1)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Smart Notes Page ─────────────────────────────────────────────────────────
export interface SmartNotesPageProps {
  open: boolean;
  onClose: () => void;
}

const RAIL_WIDTH = 212;

export function SmartNotesPage({ open, onClose }: SmartNotesPageProps) {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedId, setSelectedId] = useState<string>("n1");
  const [autoSave, setAutoSave] = useState(true);
  const { showToast } = useToast();

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  // ── Clipboard auto-save simulation ──
  useEffect(() => {
    const handleCopy = () => {
      if (autoSave) {
        showToast({
          type: "success",
          title: "Link saved to notes",
          message: "Auto Save captured a copied link.",
        });
      } else {
        showToast({
          type: "info",
          title: "Auto-save is off",
          message: "Enable Auto Save to capture copied links.",
          duration: 2800,
        });
      }
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [autoSave, showToast]);

  const handleAddNote = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title: "New Note",
      preview: "Take note...",
      date: "2026年4月12日",
      time: `${hh}:${mm}`,
      sourceUrl: "",
      sourceDomain: "",
      content: "",
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedId(newNote.id);
    showToast({ type: "success", title: "Note created" });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      if (id === selectedId && remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
      return remaining;
    });
    showToast({ type: "success", title: "Note deleted" });
  };

  const handleToggleAutoSave = () => {
    const next = !autoSave;
    setAutoSave(next);
    showToast({
      type: "info",
      title: next ? "Auto-save enabled" : "Auto-save disabled",
      message: next
        ? "Copied links will be saved to notes."
        : "Copied links will not be captured.",
      duration: 2600,
    });
  };

  return (
    <SmartNotesShell open={open}>
      <WorkspaceChromeBar
        autoSave={autoSave}
        onToggleAutoSave={handleToggleAutoSave}
        onAddNote={handleAddNote}
        selectedNote={selectedNote}
        onClose={onClose}
        railWidth={RAIL_WIDTH}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <NotesRail
          notes={notes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={handleDeleteNote}
          width={RAIL_WIDTH}
        />
        <ReadingCanvas note={selectedNote} />
      </div>
    </SmartNotesShell>
  );
}