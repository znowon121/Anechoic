import { useState, useMemo } from "react";
import { Bookmark, Search, Trash2 } from "lucide-react";
import {
  UtilityModal,
  ModalHeader,
  ModalSearch,
  ModalTokens,
  RowAction,
} from "./UtilityModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookmarkEntry {
  id: string;
  title: string;
  url: string;
  domain: string;
  letter: string;
}

interface BookmarksModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_BOOKMARKS: BookmarkEntry[] = [
  {
    id: "bm1",
    title: "Google",
    url: "https://www.google.com",
    domain: "google.com",
    letter: "G",
  },
  {
    id: "bm2",
    title: "React – A JavaScript library for building user interfaces",
    url: "https://react.dev/learn",
    domain: "react.dev",
    letter: "R",
  },
  {
    id: "bm3",
    title: "Tailwind CSS - Rapidly build modern websites",
    url: "https://tailwindcss.com",
    domain: "tailwindcss.com",
    letter: "T",
  },
  {
    id: "bm4",
    title: "GitHub: Let's build from here",
    url: "https://github.com",
    domain: "github.com",
    letter: "G",
  },
  {
    id: "bm5",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    domain: "developer.mozilla.org",
    letter: "M",
  },
  {
    id: "bm6",
    title: "TypeScript: JavaScript With Syntax For Types",
    url: "https://typescriptlang.org/docs/handbook",
    domain: "typescriptlang.org",
    letter: "T",
  },
  {
    id: "bm7",
    title: "Stack Overflow - Where Developers Learn, Share & Build Careers",
    url: "https://stackoverflow.com",
    domain: "stackoverflow.com",
    letter: "S",
  },
  {
    id: "bm8",
    title: "Figma: The Collaborative Interface Design Tool",
    url: "https://figma.com",
    domain: "figma.com",
    letter: "F",
  },
  {
    id: "bm9",
    title: "Can I use... Support tables for HTML5, CSS3",
    url: "https://caniuse.com",
    domain: "caniuse.com",
    letter: "C",
  },
  {
    id: "bm10",
    title: "Vercel: Develop. Preview. Ship.",
    url: "https://vercel.com",
    domain: "vercel.com",
    letter: "V",
  },
];

const accent = ModalTokens.accents.bookmarks;

// ─── Bookmark Row ─────────────────────────────────────────────────────────────
function BookmarkRow({
  entry,
  onDelete,
}: {
  entry: BookmarkEntry;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center cursor-default"
      style={{
        padding: "9px 20px",
        gap: 14,
        background: hovered ? ModalTokens.rowHoverBg : "transparent",
        transition: "background 0.1s",
      }}
    >
      {/* Letter chip */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: hovered ? accent.bg : "#F5F5F6",
          border: hovered ? "none" : "1px solid rgba(0,0,0,0.04)",
          color: hovered ? accent.color : "#A0A4AB",
          fontSize: 12.5,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          transition: "all 0.12s",
        }}
      >
        {entry.letter}
      </span>

      {/* Title + domain */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 3 }}>
        <span
          className="truncate"
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 450,
            letterSpacing: "-0.01em",
            color: ModalTokens.titleColor,
            lineHeight: "18px",
          }}
        >
          {entry.title}
        </span>
        <span
          className="truncate"
          style={{
            fontSize: 11.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            color: "#B4B8BF",
            letterSpacing: "-0.005em",
            lineHeight: "15px",
          }}
        >
          {entry.domain}
        </span>
      </div>

      {/* Row actions — visible on hover */}
      <div
        className="flex items-center shrink-0"
        style={{
          gap: 3,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.1s",
        }}
      >
        <RowAction
          icon={<Trash2 size={14} strokeWidth={1.6} />}
          onClick={() => onDelete(entry.id)}
          title="Delete"
          hoverColor="#C85040"
        />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BookmarksModal({ open, onClose }: BookmarksModalProps) {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<BookmarkEntry[]>(MOCK_BOOKMARKS);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <UtilityModal open={open} onClose={onClose} width={520}>
      <ModalHeader
        icon={<Bookmark size={15} strokeWidth={1.8} />}
        iconAccent={accent}
        title="Bookmarks"
        onClose={onClose}
      />

      <ModalSearch
        value={search}
        onChange={setSearch}
        placeholder="Search bookmarks..."
        icon={<Search size={13} strokeWidth={1.8} />}
      />

      {/* Bookmarks flat list */}
      <div
        className="flex-1 overflow-y-auto utility-modal-scroll"
        style={{
          paddingBottom: 8,
          minHeight: 0,
        }}
      >
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              padding: "48px 20px",
              gap: 8,
            }}
          >
            <Bookmark
              size={28}
              strokeWidth={1.2}
              style={{ color: "#D8D8DD" }}
            />
            <span
              style={{
                fontSize: 13,
                fontFamily: "Inter, system-ui, sans-serif",
                color: ModalTokens.tertiaryColor,
                letterSpacing: "-0.01em",
              }}
            >
              {search ? "No matching bookmarks" : "No bookmarks saved yet"}
            </span>
          </div>
        ) : (
          filtered.map((entry) => (
            <BookmarkRow
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </UtilityModal>
  );
}