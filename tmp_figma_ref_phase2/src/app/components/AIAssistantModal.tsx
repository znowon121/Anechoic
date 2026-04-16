import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, ChevronDown, ChevronRight, ArrowLeft, Plus, Send,
  Code2, FileText, Cpu, Lightbulb,
  X, Users, UserRound, Trash2,
} from "lucide-react";
import { UtilityModal, ModalTokens } from "./UtilityModal";
import { useToast } from "./ToastProvider";

// ─── Accent ───────────────────────────────────────────────────────────────────
const accent = ModalTokens.accents.assistant;
// { bg: "rgba(154,132,214,0.08)", color: "#9A84D6", light: "rgba(154,132,214,0.05)" }

// ─── Types ────────────────────────────────────────────────────────────────────
type View = "chat" | "hub" | "create";
type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

interface Character {
  id: string;
  name: string;
  description: string;   // tagline — used as card subtitle
  greeting?: string;     // opening message shown to user
  systemPrompt?: string; // role-play instruction
  openingMessage?: string;
  isDefault?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MODELS = ["local models", "Gemini", "Deepseek", "Trinity (free)"];

const SUGGESTIONS = [
  { icon: <Code2 size={11} strokeWidth={1.6} />, label: "Write a code snippet"  },
  { icon: <FileText size={11} strokeWidth={1.6} />, label: "Summarize this page" },
  { icon: <Cpu size={11} strokeWidth={1.6} />, label: "Run local AI task"       },
  { icon: <Lightbulb size={11} strokeWidth={1.6} />, label: "Help me brainstorm" },
];

const DEFAULT_CHARACTER: Character = {
  id: "default",
  name: "Default Assistant",
  description: "A helpful, general-purpose AI assistant ready for any task.",
  openingMessage: "Hello! I'm your AI assistant. How can I help you today?",
  isDefault: true,
};

const MOCK_REPLIES = [
  "That's a great question. Let me think through this carefully and give you the most helpful response I can.",
  "Happy to help with that! Here's what I know based on the context you've shared:",
  "Sure — here's a thoughtful approach to what you're asking about:",
  "Great question. Let me break this down step by step so it's easy to follow.",
  "I can help with that. Here's a concise overview to get you started:",
];

// ─── Shared: ghost icon button ────────────────────────────────────────────────
function GhostIconBtn({
  onClick,
  children,
  title,
  accentOnHover,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  accentOnHover?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      className="flex items-center justify-center shrink-0 cursor-pointer"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "none",
        background: hovered
          ? accentOnHover
            ? accent.bg
            : ModalTokens.ghostHoverBg
          : "transparent",
        color: hovered
          ? accentOnHover
            ? accent.color
            : "#6F7278"
          : ModalTokens.iconDefault,
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Model dropdown ───────────────────────────────────────────────────────────
function ModelDropdown({
  models,
  current,
  onSelect,
  onClose,
}: {
  models: string[];
  current: string;
  onSelect: (m: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 5px)",
        left: 0,
        width: 196,
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 13,
        boxShadow:
          "0 16px 48px rgba(0,0,0,0.10), 0 4px 14px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        zIndex: 20,
        padding: 4,
        animation: "modelDropIn 0.14s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* Section label */}
      <div
        style={{
          padding: "5px 10px 3px",
          fontSize: 10,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: ModalTokens.mutedColor,
          userSelect: "none",
        }}
      >
        Model
      </div>

      {/* Hairline divider */}
      <div
        style={{
          height: 1,
          background: "#F0F0F2",
          margin: "3px 6px 3px",
        }}
      />

      {models.map((m) => (
        <ModelOption
          key={m}
          label={m}
          active={m === current}
          onSelect={() => {
            onSelect(m);
            onClose();
          }}
        />
      ))}
    </div>
  );
}

function ModelOption({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center cursor-pointer"
      style={{
        gap: 8,
        padding: "6px 10px",
        borderRadius: 8,
        border: "none",
        background: active
          ? hovered
            ? "rgba(154,132,214,0.11)"
            : "rgba(154,132,214,0.07)"
          : hovered
          ? "#F7F7F8"
          : "transparent",
        transition: "background 0.1s",
        textAlign: "left",
      }}
    >
      {/* Active dot indicator */}
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          flexShrink: 0,
          background: active ? accent.color : "transparent",
          boxShadow: active ? `0 0 0 1.5px ${accent.bg}` : "none",
          transition: "background 0.15s, box-shadow 0.15s",
        }}
      />

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: 12.5,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: active ? 500 : 400,
          letterSpacing: "-0.01em",
          color: active ? ModalTokens.titleColor : ModalTokens.subtitleColor,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Suggestion card ──────────────────────────────────────────────────────────
function SuggestionCard({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-[10px] w-full cursor-pointer text-left"
      style={{
        padding: "10px 13px",
        borderRadius: 10,
        border: `1px solid ${hovered ? "#DDDDE1" : "#EDEDED"}`,
        background: hovered ? "#F9F9FA" : "#FFFFFF",
        transition: "all 0.13s",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: hovered ? "#E8E8EA" : "#EEEEEF",
          color: hovered ? "#7A7E85" : "#9EA2A8",
          flexShrink: 0,
          transition: "background 0.13s, color 0.13s",
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          color: ModalTokens.titleColor,
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "80%",
          padding: "9px 13px",
          borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
          background: isUser ? "#1F2023" : "#F7F7F8",
          border: isUser ? "none" : "1px solid #EDEDEF",
          color: isUser ? "#FFFFFF" : ModalTokens.titleColor,
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.55,
        }}
      >
        {content}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          padding: "10px 14px",
          borderRadius: "12px 12px 12px 3px",
          background: "#F7F7F8",
          border: "1px solid #EDEDEF",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#C4C8CF",
              display: "inline-block",
              animation: `aiDotPulse 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Send button ──────────────────────────────────────────────────────────────
function SendButton({ hasContent, onClick }: { hasContent: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-center shrink-0 cursor-pointer"
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        border: hasContent
          ? `1px solid rgba(154,132,214,${hovered ? "0.24" : "0.16"})`
          : `1px solid ${hovered ? "#DDDDE0" : "#E8E8EB"}`,
        background: hasContent
          ? hovered
            ? "rgba(154,132,214,0.13)"
            : "rgba(154,132,214,0.08)"
          : hovered
          ? "#F4F4F6"
          : "transparent",
        color: hasContent ? accent.color : hovered ? "#9EA2A8" : "#C4C8CF",
        transition: "all 0.14s",
      }}
    >
      <Send size={13} strokeWidth={1.8} />
    </button>
  );
}

// ─── Character card ───────────────────────────────────────────────────────────
function CharacterCard({
  character,
  isActive,
  onSelect,
  onDelete,
}: {
  character: Character;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const initial = character.name.charAt(0).toUpperCase();

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className="w-full text-left cursor-pointer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 13px",
        borderRadius: 11,
        border: `1px solid ${
          isActive
            ? "rgba(154,132,214,0.18)"
            : hovered
            ? "#E4E4E8"
            : "#EEEEEF"
        }`,
        background: isActive
          ? "rgba(154,132,214,0.04)"
          : hovered
          ? "#FAFAFA"
          : "#FFFFFF",
        transition: "all 0.13s",
        outline: "none",
      }}
    >
      {/* Avatar chip */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: isActive ? "rgba(154,132,214,0.10)" : "#F0F0F2",
          color: isActive ? accent.color : ModalTokens.subtitleColor,
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          transition: "background 0.13s, color 0.13s",
        }}
      >
        {initial}
      </span>

      {/* Text block */}
      <div
        className="flex flex-col flex-1"
        style={{ gap: 2, minWidth: 0 }}
      >
        <span
          style={{
            fontSize: 13,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.013em",
            color: ModalTokens.titleColor,
            lineHeight: 1,
          }}
        >
          {character.name}
        </span>
        <span
          style={{
            fontSize: 12,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.005em",
            color: ModalTokens.tertiaryColor,
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {character.description}
        </span>
      </div>

      {/* Right indicator / delete */}
      {isActive ? (
        <span
          style={{
            flexShrink: 0,
            padding: "2px 7px",
            borderRadius: 5,
            background: "rgba(154,132,214,0.08)",
            color: accent.color,
            fontSize: 10.5,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          Active
        </span>
      ) : hovered && onDelete ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete character"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 7,
            border: "none",
            background: "rgba(192,64,64,0.08)",
            color: "#C04040",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <Trash2 size={11} strokeWidth={1.7} />
        </button>
      ) : hovered ? (
        <ChevronRight
          size={12}
          strokeWidth={2}
          style={{ color: ModalTokens.tertiaryColor, flexShrink: 0 }}
        />
      ) : null}
    </div>
  );
}

// ─── New character row ────────────────────────────────────────────────────────
function NewCharacterRow({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left cursor-pointer flex items-center"
      style={{
        gap: 12,
        padding: "9px 13px",
        borderRadius: 11,
        border: `1px solid ${hovered ? "#E2E2E6" : "#EBEBEE"}`,
        background: hovered ? "#F9F9FA" : "transparent",
        transition: "all 0.13s",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: hovered ? "rgba(154,132,214,0.08)" : "#F4F4F6",
          color: hovered ? accent.color : ModalTokens.tertiaryColor,
          transition: "background 0.13s, color 0.13s",
        }}
      >
        <Plus size={13} strokeWidth={1.8} />
      </span>
      <span
        style={{
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.01em",
          color: hovered ? ModalTokens.subtitleColor : ModalTokens.tertiaryColor,
          transition: "color 0.13s",
        }}
      >
        New character
      </span>
    </button>
  );
}

// ─── Form field wrapper ───────────────────────────────────────────────────────
function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontSize: 12,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: "#4A4D54",
          }}
        >
          {label}
        </span>
        {hint && (
          <span
            style={{
              fontSize: 10.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.003em",
              color: ModalTokens.mutedColor,
            }}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function fieldStyle(focused: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 11px",
    borderRadius: ModalTokens.fieldRadius,
    border: `1.5px solid ${focused ? "rgba(154,132,214,0.55)" : "#CFCFD4"}`,
    background: "#FFFFFF",
    boxShadow: focused
      ? "0 0 0 3px rgba(154,132,214,0.09), 0 1px 3px rgba(0,0,0,0.04)"
      : "0 1px 2px rgba(0,0,0,0.04)",
    color: ModalTokens.fieldText,
    fontSize: 13,
    fontFamily: "Inter, system-ui, sans-serif",
    letterSpacing: "-0.01em",
    outline: "none",
    transition: "all 0.15s",
    boxSizing: "border-box",
  };
}

// ─── Create/Cancel action buttons ─────────────────────────────────────────────
function CancelButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      style={{
        padding: "8px 18px",
        borderRadius: 9,
        border: `1px solid ${hovered ? "#CECECE" : "#E0E0E3"}`,
        background: hovered ? "#F0F0F2" : "#F7F7F8",
        color: hovered ? "#5A5D62" : "#7A7E85",
        fontSize: 13,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        transition: "all 0.14s",
      }}
    >
      Cancel
    </button>
  );
}

function CreateButton({
  onClick,
  disabled,
  label = "Save",
}: {
  onClick: () => void;
  disabled: boolean;
  label?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      style={{
        padding: "8px 22px",
        borderRadius: 9,
        border: disabled
          ? `1px solid rgba(154,132,214,0.14)`
          : `1px solid rgba(154,132,214,${hovered ? "0.42" : "0.30"})`,
        background: disabled
          ? "rgba(154,132,214,0.05)"
          : hovered
          ? "rgba(154,132,214,0.20)"
          : "rgba(154,132,214,0.13)",
        color: disabled ? "rgba(154,132,214,0.38)" : hovered ? "#7A6AC0" : "#8874C8",
        fontSize: 13,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        transition: "all 0.14s",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface AIAssistantModalProps {
  open: boolean;
  onClose: () => void;
}

export function AIAssistantModal({ open, onClose }: AIAssistantModalProps) {
  // ── View state ──
  const [view, setView] = useState<View>("chat");

  // ── Chat state ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [model, setModel] = useState("local models");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // ── Character state ──
  const [characters, setCharacters] = useState<Character[]>([DEFAULT_CHARACTER]);
  const [activeCharId, setActiveCharId] = useState("default");

  // ── Create form state ──
  const [formName, setFormName] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formGreeting, setFormGreeting] = useState("");
  const [formSystemPrompt, setFormSystemPrompt] = useState("");
  // kept for legacy reset compatibility
  const [formDesc, setFormDesc] = useState("");
  const [formOpening, setFormOpening] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);

  // ── Toast ──
  const { showToast } = useToast();

  // ── Refs ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChar = characters.find((c) => c.id === activeCharId) ?? DEFAULT_CHARACTER;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ──
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const reply = MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
    }, 1300);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Model switch ──
  const handleModelSelect = (m: string) => {
    if (m !== model) {
      setModel(m);
      showToast({ type: "info", title: `Switched to ${m}` });
    }
    setModelDropdownOpen(false);
  };

  // ── Create character ──
  const handleCreateCharacter = () => {
    if (!formName.trim()) {
      showToast({
        type: "warning",
        title: "Character name required",
        message: "Please enter a name to continue.",
      });
      return;
    }
    const newChar: Character = {
      id: Date.now().toString(),
      name: formName.trim(),
      description: formTagline.trim() || "A custom AI character.",
      greeting: formGreeting.trim() || undefined,
      systemPrompt: formSystemPrompt.trim() || undefined,
      openingMessage: formGreeting.trim() || undefined,
    };
    setCharacters((prev) => [...prev, newChar]);
    setFormName("");
    setFormTagline("");
    setFormGreeting("");
    setFormSystemPrompt("");
    setFormDesc("");
    setFormOpening("");
    setView("hub");
    showToast({
      type: "success",
      title: `"${newChar.name}" created`,
      message: "Character is ready in the hub.",
    });
  };

  // ── Delete character ──
  const handleDeleteCharacter = (char: Character) => {
    setCharacters((prev) => prev.filter((c) => c.id !== char.id));
    if (activeCharId === char.id) setActiveCharId("default");
    showToast({ type: "success", title: `"${char.name}" deleted` });
  };

  // ── Switch character ──
  const handleSelectCharacter = (char: Character) => {
    if (char.id !== activeCharId) {
      showToast({ type: "info", title: `Switched to ${char.name}` });
    }
    setActiveCharId(char.id);
    setMessages([]);
    setView("chat");
  };

  // ── Suggestion click ──
  const handleSuggestion = (label: string) => {
    setInput(label);
    inputRef.current?.focus();
  };

  // ── Header label ──
  const headerTitle =
    view === "hub" ? "Character Hub" : view === "create" ? "New Character" : activeChar.name;

  return (
    <>
      {/* Dot pulse animation */}
      <style>{`
        @keyframes aiDotPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40%            { opacity: 1;   transform: scale(1);    }
        }
        @keyframes modelDropIn {
          from { opacity: 0; transform: translateY(-5px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      <UtilityModal open={open} onClose={onClose} width={520} maxHeight="76vh">

        {/* ════ Custom header ════════════════════════════════════════════════ */}
        <div
          className="shrink-0 flex items-center"
          style={{
            padding: "14px 20px 12px",
            borderBottom: `1px solid ${ModalTokens.headerBorder}`,
            gap: 12,
          }}
        >
          {/* Left icon / back */}
          {view === "chat" ? (
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: accent.bg,
                border: "1px solid rgba(154,132,214,0.12)",
                color: accent.color,
              }}
            >
              <Bot size={15} strokeWidth={1.7} />
            </span>
          ) : (
            <GhostIconBtn onClick={() => setView("chat")} title="Back">
              <ArrowLeft size={14} strokeWidth={1.7} />
            </GhostIconBtn>
          )}

          {/* Title block */}
          <div className="flex flex-col flex-1" style={{ gap: 2 }}>
            <span
              style={{
                fontSize: 14,
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: ModalTokens.titleColor,
                lineHeight: 1,
              }}
            >
              {headerTitle}
            </span>

            {/* Model selector row — chat view only */}
            {view === "chat" && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setModelDropdownOpen((v) => !v)}
                  className="flex items-center gap-[4px] cursor-pointer"
                  style={{
                    background: modelDropdownOpen ? "rgba(154,132,214,0.07)" : "none",
                    border: "none",
                    outline: "none",
                    padding: modelDropdownOpen ? "1px 5px 1px 4px" : "1px 0 0",
                    borderRadius: 5,
                    color: modelDropdownOpen ? ModalTokens.subtitleColor : ModalTokens.tertiaryColor,
                    fontSize: 11.5,
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    transition: "color 0.12s, background 0.12s, padding 0.12s",
                  }}
                >
                  {model}
                  <ChevronDown
                    size={10}
                    strokeWidth={2}
                    style={{
                      transform: modelDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.16s ease",
                      marginTop: 0.5,
                    }}
                  />
                </button>

                {modelDropdownOpen && (
                  <ModelDropdown
                    models={MODELS}
                    current={model}
                    onSelect={handleModelSelect}
                    onClose={() => setModelDropdownOpen(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center" style={{ gap: 4 }}>
            {view === "chat" && (
              <GhostIconBtn
                onClick={() => setView("hub")}
                title="Character Hub"
                accentOnHover
              >
                <Users size={14} strokeWidth={1.7} />
              </GhostIconBtn>
            )}
            {view === "hub" && (
              <GhostIconBtn
                onClick={() => {
                  setFormName("");
                  setFormTagline("");
                  setFormGreeting("");
                  setFormSystemPrompt("");
                  setFormDesc("");
                  setFormOpening("");
                  setView("create");
                }}
                title="New Character"
                accentOnHover
              >
                <Plus size={14} strokeWidth={1.7} />
              </GhostIconBtn>
            )}
            {/* Close */}
            <GhostIconBtn onClick={onClose} title="Close">
              <X size={14} strokeWidth={1.8} />
            </GhostIconBtn>
          </div>
        </div>

        {/* ════ Body ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-col" style={{ flex: 1, overflow: "hidden" }}>

          {/* ── Chat view ─────────────────────────────────────────────────── */}
          {view === "chat" && (
            <>
              {/* Scrollable message/welcome area */}
              <div className="flex-1 overflow-y-auto" style={{ padding: "0 20px" }}>
                {messages.length === 0 ? (
                  /* Welcome / empty state */
                  <div
                    className="flex flex-col items-center justify-center"
                    style={{ minHeight: "100%", padding: "24px 16px 20px" }}
                  >
                    {/* Icon chip */}
                    <span
                      className="flex items-center justify-center"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: accent.bg,
                        border: "1px solid rgba(154,132,214,0.10)",
                        color: accent.color,
                        marginBottom: 11,
                      }}
                    >
                      <Bot size={18} strokeWidth={1.7} />
                    </span>

                    {/* Headline */}
                    <p
                      style={{
                        fontSize: 15,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 500,
                        letterSpacing: "-0.022em",
                        color: ModalTokens.titleColor,
                        margin: "0 0 5px",
                        textAlign: "center",
                      }}
                    >
                      What can I help with?
                    </p>

                    {/* Subtext */}
                    <p
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 400,
                        letterSpacing: "-0.008em",
                        color: ModalTokens.tertiaryColor,
                        margin: "0 0 20px",
                        textAlign: "center",
                        lineHeight: 1.5,
                        maxWidth: 280,
                      }}
                    >
                      Ask me anything, or start with one of these suggestions.
                    </p>

                    {/* 2×2 suggestion grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        width: "100%",
                        maxWidth: 420,
                      }}
                    >
                      {SUGGESTIONS.map((s) => (
                        <SuggestionCard
                          key={s.label}
                          icon={s.icon}
                          label={s.label}
                          onClick={() => handleSuggestion(s.label)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Message thread */
                  <div
                    className="flex flex-col"
                    style={{ gap: 9, padding: "16px 0 8px" }}
                  >
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div
                className="shrink-0"
                style={{
                  borderTop: `1px solid ${ModalTokens.headerBorder}`,
                  padding: "10px 16px 12px",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                {/* Text field */}
                <div
                  className="flex-1"
                  style={{
                    background: inputFocused ? "#FFFFFF" : ModalTokens.fieldBg,
                    border: `1.5px solid ${inputFocused ? ModalTokens.fieldBorderFocus : ModalTokens.fieldBorder}`,
                    borderRadius: ModalTokens.fieldRadius,
                    boxShadow: inputFocused ? ModalTokens.fieldShadowFocus : ModalTokens.fieldShadowRest,
                    padding: "7px 12px",
                    display: "flex",
                    alignItems: "center",
                    minHeight: 36,
                    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder={`Message ${activeChar.name}…`}
                    rows={1}
                    className="flex-1 bg-transparent outline-none resize-none"
                    style={{
                      color: ModalTokens.fieldText,
                      fontSize: 13,
                      fontFamily: "Inter, system-ui, sans-serif",
                      letterSpacing: "-0.01em",
                      caretColor: ModalTokens.fieldText,
                      lineHeight: 1.5,
                      maxHeight: 80,
                      overflowY: "auto",
                    }}
                  />
                </div>

                <SendButton hasContent={!!input.trim()} onClick={handleSend} />
              </div>
            </>
          )}

          {/* ── Character Hub view ────────────────────────────────────────── */}
          {view === "hub" && (
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: "16px 20px 20px" }}
            >
              <div className="flex flex-col" style={{ gap: 5 }}>

                {/* Section label row */}
                <div
                  className="flex items-center"
                  style={{ marginBottom: 3 }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 10.5,
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: ModalTokens.mutedColor,
                    }}
                  >
                    Characters
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                      color: ModalTokens.mutedColor,
                    }}
                  >
                    {characters.length}
                  </span>
                </div>

                {/* Character cards */}
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    isActive={char.id === activeCharId}
                    onSelect={() => handleSelectCharacter(char)}
                    onDelete={!char.isDefault ? () => handleDeleteCharacter(char) : undefined}
                  />
                ))}

                {/* Thin separator */}
                <div
                  style={{
                    height: 1,
                    background: "#F2F2F4",
                    margin: "3px 0",
                  }}
                />

                {/* New character row */}
                <NewCharacterRow
                  onClick={() => {
                    setFormName("");
                    setFormTagline("");
                    setFormGreeting("");
                    setFormSystemPrompt("");
                    setFormDesc("");
                    setFormOpening("");
                    setView("create");
                  }}
                />

              </div>
            </div>
          )}

          {/* ── Create Character form ─────────────────────────────────────── */}
          {view === "create" && (
            <div
              className="flex-1 overflow-y-auto"
              style={{ padding: "18px 20px 0" }}
            >
              <div className="flex flex-col" style={{ gap: 14 }}>

                {/* ── Name + Avatar row ── */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
                  {/* Name field */}
                  <FormField label="Character name" style={{ flex: 1 } as React.CSSProperties}>
                    <input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. Code Helper"
                      style={fieldStyle(focusedField === "name")}
                    />
                  </FormField>

                  {/* Avatar preview */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, paddingBottom: 1 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        color: avatarHovered ? ModalTokens.subtitleColor : ModalTokens.mutedColor,
                        userSelect: "none",
                        transition: "color 0.14s",
                      }}
                    >
                      Avatar
                    </span>
                    <span
                      className="flex items-center justify-center"
                      onMouseEnter={() => setAvatarHovered(true)}
                      onMouseLeave={() => setAvatarHovered(false)}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 13,
                        background: formName.trim()
                          ? avatarHovered
                            ? "rgba(154,132,214,0.14)"
                            : "rgba(154,132,214,0.10)"
                          : avatarHovered
                          ? "#EBEBED"
                          : "#F2F2F4",
                        border: formName.trim()
                          ? `1.5px solid rgba(154,132,214,${avatarHovered ? "0.24" : "0.14"})`
                          : `1.5px solid ${avatarHovered ? "#D4D4D8" : "#E8E8EB"}`,
                        color: formName.trim()
                          ? avatarHovered ? "#7A6AC0" : accent.color
                          : avatarHovered ? ModalTokens.subtitleColor : ModalTokens.mutedColor,
                        fontSize: 19,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        transition: "all 0.16s",
                        cursor: "default",
                        boxShadow: avatarHovered
                          ? formName.trim()
                            ? "0 0 0 3px rgba(154,132,214,0.08)"
                            : "0 0 0 3px rgba(0,0,0,0.03)"
                          : "none",
                      }}
                    >
                      {formName.trim() ? (
                        formName.trim().charAt(0).toUpperCase()
                      ) : (
                        <UserRound size={20} strokeWidth={1.5} />
                      )}
                    </span>
                  </div>
                </div>

                {/* ── Tagline ── */}
                <FormField label="Tagline" hint="Shown below the character name">
                  <input
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    onFocus={() => setFocusedField("tagline")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. A philosophical guide from ancient Greece"
                    style={fieldStyle(focusedField === "tagline")}
                  />
                </FormField>

                {/* ── Greeting ── */}
                <FormField label="Greeting" hint="First message sent to the user">
                  <input
                    value={formGreeting}
                    onChange={(e) => setFormGreeting(e.target.value)}
                    onFocus={() => setFocusedField("greeting")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Hello! How can I assist you?"
                    style={fieldStyle(focusedField === "greeting")}
                  />
                </FormField>

                {/* ── System Prompt ── */}
                <FormField label="System prompt" hint="Determines how the AI plays the role">
                  <textarea
                    value={formSystemPrompt}
                    onChange={(e) => setFormSystemPrompt(e.target.value)}
                    onFocus={() => setFocusedField("system")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="You are a…"
                    rows={4}
                    className="resize-none"
                    style={{ ...fieldStyle(focusedField === "system"), lineHeight: 1.55 }}
                  />
                </FormField>

              </div>

              {/* ── Form footer ── */}
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  background: "#FFFFFF",
                  borderTop: `1px solid ${ModalTokens.headerBorder}`,
                  padding: "12px 0 16px",
                  marginTop: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <CancelButton onClick={() => setView("hub")} />
                <CreateButton
                  onClick={handleCreateCharacter}
                  disabled={!formName.trim()}
                  label="Save character"
                />
              </div>
            </div>
          )}

        </div>
      </UtilityModal>
    </>
  );
}