import { useState, useEffect, useRef } from "react";
import { Timer } from "lucide-react";
import { UtilityModal, ModalHeader, ModalTokens } from "./UtilityModal";
import { useToast } from "./ToastProvider";

// ─── Mode config ──────────────────────────────────────────────────────────────
type ModeKey = "work" | "shortBreak" | "longBreak";

const MODES: Record<ModeKey, { label: string; duration: number; display: string }> = {
  work:       { label: "Work",        duration: 25 * 60, display: "Work Time"    },
  shortBreak: { label: "Short Break", duration:  5 * 60, display: "Short Break"  },
  longBreak:  { label: "Long Break",  duration: 15 * 60, display: "Long Break"   },
};

// ─── Ring geometry ────────────────────────────────────────────────────────────
const RING_SIZE     = 164;
const STROKE        = 1.5;
const RADIUS        = (RING_SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const accent = ModalTokens.accents.pomodoro;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ─── Mode tab pill ────────────────────────────────────────────────────────────
function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      style={{
        padding: "5px 15px",
        borderRadius: 7,
        border: active
          ? "1px solid rgba(0,0,0,0.06)"
          : "1px solid transparent",
        background: active
          ? "#FFFFFF"
          : hovered
          ? "rgba(0,0,0,0.03)"
          : "transparent",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.03)" : "none",
        color: active ? accent.color : hovered ? ModalTokens.subtitleColor : "#9EA2A8",
        fontSize: 12,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: active ? 500 : 400,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Start / Pause button ─────────────────────────────────────────────────────
function StartPauseButton({
  running,
  onClick,
}: {
  running: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      style={{
        padding: "9px 34px",
        borderRadius: 9,
        border: running
          ? `1px solid rgba(212,107,95,${hovered ? "0.22" : "0.14"})`
          : "none",
        background: running
          ? hovered
            ? "rgba(212,107,95,0.12)"
            : "rgba(212,107,95,0.08)"
          : hovered
          ? "#2E3035"
          : "#1F2023",
        color: running ? accent.color : "#FFFFFF",
        fontSize: 13,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        transition: "all 0.15s",
      }}
    >
      {running ? "Pause" : "Start"}
    </button>
  );
}

// ─── Reset button ─────────────────────────────────────────────────────────────
function ResetButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="cursor-pointer"
      style={{
        padding: "9px 22px",
        borderRadius: 9,
        border: `1px solid ${hovered ? "#CECECE" : "#E0E0E3"}`,
        background: hovered ? "#F0F0F2" : "#F7F7F8",
        color: hovered ? "#5A5D62" : "#7A7E85",
        fontSize: 13,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 400,
        letterSpacing: "-0.01em",
        transition: "all 0.15s",
      }}
    >
      Reset
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
interface PomodoroModalProps {
  open: boolean;
  onClose: () => void;
}

export function PomodoroModal({ open, onClose }: PomodoroModalProps) {
  const [mode, setMode]           = useState<ModeKey>("work");
  const [secondsLeft, setSeconds] = useState(MODES.work.duration);
  const [running, setRunning]     = useState(false);
  const [cycles, setCycles]       = useState(0);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedMode             = useRef<ModeKey | null>(null);
  const { showToast }             = useToast();

  // Reset when mode changes
  useEffect(() => {
    setRunning(false);
    setSeconds(MODES[mode].duration);
  }, [mode]);

  // Countdown tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (mode === "work") setCycles((c) => c + 1);
            completedMode.current = mode; // signal completion
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  // Fire completion toast after timer naturally reaches 0
  useEffect(() => {
    if (secondsLeft === 0 && completedMode.current !== null) {
      const m = completedMode.current;
      completedMode.current = null;
      if (m === "work") {
        showToast({
          type: "success",
          title: "Work session complete!",
          message: "Time for a well-earned break.",
          duration: 4000,
        });
      } else if (m === "shortBreak") {
        showToast({
          type: "info",
          title: "Break over",
          message: "Ready to focus again?",
        });
      } else {
        showToast({
          type: "info",
          title: "Long break over",
          message: "Time to get back to work.",
        });
      }
    }
  }, [secondsLeft, showToast]);

  const handleStartPause = () => {
    const next = !running;
    setRunning(next);
    if (next) {
      showToast({ type: "info", title: "Timer started", duration: 1800 });
    } else {
      showToast({ type: "info", title: "Timer paused", duration: 1800 });
    }
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(MODES[mode].duration);
    showToast({ type: "info", title: "Timer reset", duration: 1800 });
  };

  const progress    = secondsLeft / MODES[mode].duration;
  const dashOffset  = CIRCUMFERENCE * (1 - progress);

  return (
    <UtilityModal open={open} onClose={onClose} width={480}>
      {/* Header */}
      <ModalHeader
        icon={<Timer size={15} strokeWidth={1.8} />}
        iconAccent={accent}
        title="Pomodoro"
        onClose={onClose}
      />

      {/* Body */}
      <div
        className="flex flex-col items-center"
        style={{ padding: "24px 32px 30px" }}
      >

        {/* ── Mode tabs ── */}
        <div
          className="flex items-center"
          style={{
            gap: 2,
            padding: 4,
            background: "#F5F5F6",
            borderRadius: 11,
            border: "1px solid rgba(0,0,0,0.04)",
          }}
        >
          {(Object.keys(MODES) as ModeKey[]).map((key) => (
            <ModeTab
              key={key}
              label={MODES[key].label}
              active={mode === key}
              onClick={() => setMode(key)}
            />
          ))}
        </div>

        {/* ── Ring + digits ── */}
        <div
          style={{
            position: "relative",
            width: RING_SIZE,
            height: RING_SIZE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 28,
            marginBottom: 0,
          }}
        >
          {/* SVG ring */}
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "rotate(-90deg)",
            }}
          >
            {/* Track */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(0,0,0,0.07)"
              strokeWidth={STROKE}
            />
            {/* Progress arc */}
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={running ? accent.color : "rgba(212,107,95,0.22)"}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{
                transition: "stroke-dashoffset 0.9s linear, stroke 0.4s ease",
              }}
            />
          </svg>

          {/* Timer digits */}
          <span
            style={{
              fontSize: 42,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 250,
              letterSpacing: "-0.04em",
              color: running ? accent.color : ModalTokens.titleColor,
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              transition: "color 0.35s ease",
              userSelect: "none",
            }}
          >
            {fmt(secondsLeft)}
          </span>
        </div>

        {/* ── Mode label + cycles ── */}
        <div
          className="flex flex-col items-center"
          style={{ gap: 5, marginTop: 16, marginBottom: 28 }}
        >
          <span
            style={{
              fontSize: 13,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.012em",
              color: "#5A5D62",
              lineHeight: 1,
            }}
          >
            {MODES[mode].display}
          </span>
          <span
            style={{
              fontSize: 11.5,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              color: ModalTokens.tertiaryColor,
              lineHeight: 1,
            }}
          >
            {cycles === 0
              ? "No cycles completed yet"
              : `${cycles} ${cycles === 1 ? "cycle" : "cycles"} completed`}
          </span>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <StartPauseButton running={running} onClick={handleStartPause} />
          <ResetButton onClick={handleReset} />
        </div>

      </div>
    </UtilityModal>
  );
}