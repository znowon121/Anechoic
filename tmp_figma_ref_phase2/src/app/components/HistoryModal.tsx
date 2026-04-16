import { useState, useMemo } from "react";
import { History, Search, Globe, Trash2 } from "lucide-react";
import {
  UtilityModal,
  ModalHeader,
  ModalSearch,
  ModalGhostButton,
  ModalTokens,
  RowAction,
} from "./UtilityModal";
import { useToast } from "./ToastProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  title: string;
  url: string;
  domain: string;
  letter: string;
  visitedAt: string;
}

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    title: "Google",
    url: "https://www.google.com",
    domain: "google.com",
    letter: "G",
    visitedAt: "2026/4/11 14:22:08",
  },
  {
    id: "h2",
    title: "React – A JavaScript library for building user interfaces",
    url: "https://react.dev",
    domain: "react.dev",
    letter: "R",
    visitedAt: "2026/4/11 13:45:30",
  },
  {
    id: "h3",
    title: "Tailwind CSS - Rapidly build modern websites",
    url: "https://tailwindcss.com",
    domain: "tailwindcss.com",
    letter: "T",
    visitedAt: "2026/4/11 12:10:15",
  },
  {
    id: "h4",
    title: "GitHub: Let's build from here",
    url: "https://github.com",
    domain: "github.com",
    letter: "G",
    visitedAt: "2026/4/10 22:34:50",
  },
  {
    id: "h5",
    title: "YouTube",
    url: "https://youtube.com",
    domain: "youtube.com",
    letter: "Y",
    visitedAt: "2026/4/10 20:15:22",
  },
  {
    id: "h6",
    title: "Gmail：AI 加持、人人可享的安全邮件服务 | Goo...",
    url: "https://mail.google.com",
    domain: "mail.google.com",
    letter: "G",
    visitedAt: "2026/4/10 17:04:40",
  },
  {
    id: "h7",
    title: "Stack Overflow - Where Developers Learn & Share",
    url: "https://stackoverflow.com",
    domain: "stackoverflow.com",
    letter: "S",
    visitedAt: "2026/4/10 15:28:11",
  },
  {
    id: "h8",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    domain: "developer.mozilla.org",
    letter: "M",
    visitedAt: "2026/4/9 09:12:45",
  },
  {
    id: "h9",
    title: "Figma: The Collaborative Interface Design Tool",
    url: "https://figma.com",
    domain: "figma.com",
    letter: "F",
    visitedAt: "2026/4/9 08:30:00",
  },
  {
    id: "h10",
    title: "Vercel: Develop. Preview. Ship.",
    url: "https://vercel.com",
    domain: "vercel.com",
    letter: "V",
    visitedAt: "2026/4/8 19:45:33",
  },
];

const accent = ModalTokens.accents.history;

// ─── History Row ──────────────────────────────────────────────────────────────
function HistoryRow({
  entry,
  onDelete,
  onOpen,
}: {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
  onOpen: (url: string) => void;
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
      {/* Favicon letter */}
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

      {/* Title + meta */}
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
          {entry.visitedAt}
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
          icon={<Globe size={14} strokeWidth={1.6} />}
          onClick={() => onOpen(entry.url)}
          title="Open"
        />
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

// ─── Date Group Label ─────────────────────────────────────────────────────────
function DateLabel({ label }: { label: string }) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: "14px 20px 6px",
        gap: 10,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "#9EA2A8",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        className="flex-1"
        style={{
          height: 1,
          background: "#F0F0F2",
        }}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function HistoryModal({ open, onClose }: HistoryModalProps) {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>(MOCK_HISTORY);
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q)
    );
  }, [entries, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: HistoryEntry[] }[] = [];
    let currentDate = "";
    for (const entry of filtered) {
      const date = entry.visitedAt.split(" ")[0];
      if (date !== currentDate) {
        currentDate = date;
        // Friendly label
        const today = "2026/4/11";
        const yesterday = "2026/4/10";
        let label = date;
        if (date === today) label = "Today";
        else if (date === yesterday) label = "Yesterday";
        groups.push({ label, items: [entry] });
      } else {
        groups[groups.length - 1].items.push(entry);
      }
    }
    return groups;
  }, [filtered]);

  const handleDelete = (id: string) => {
    // Simulate a very occasional failure (≈8% chance) for demo realism
    const failed = Math.random() < 0.08;
    if (failed) {
      showToast({
        type: "error",
        title: "Failed to remove item",
        message: "Something went wrong. Please try again.",
      });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast({ type: "success", title: "Removed from history" });
  };

  const handleClearAll = () => {
    setEntries([]);
  };

  const handleOpen = (_url: string) => {
    // In a real app, this would navigate to the URL
  };

  return (
    <UtilityModal open={open} onClose={onClose} width={520}>
      <ModalHeader
        icon={<History size={15} strokeWidth={1.8} />}
        iconAccent={accent}
        title="History"
        onClose={onClose}
        actions={
          entries.length > 0 ? (
            <ModalGhostButton
              label="Clear All"
              onClick={handleClearAll}
              destructive
            />
          ) : undefined
        }
      />

      <ModalSearch
        value={search}
        onChange={setSearch}
        placeholder="Search history..."
        icon={<Search size={13} strokeWidth={1.8} />}
      />

      {/* History list */}
      <div
        className="flex-1 overflow-y-auto utility-modal-scroll"
        style={{
          paddingBottom: 8,
          minHeight: 0,
        }}
      >
        {grouped.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              padding: "48px 20px",
              gap: 8,
            }}
          >
            <History
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
              {search ? "No matching history" : "No browsing history yet"}
            </span>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <DateLabel label={group.label} />
              {group.items.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </UtilityModal>
  );
}