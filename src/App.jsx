import { useEffect, useId, useMemo, useState } from "react";
import damsLogo from "./assets/dams-logo.png";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import LandingScreen from "./pages/LandingScreen";
import Composer from "./components/Composer";
import LoadingScreen from "./pages/LoadingScreen";
import StickyComposer from "./components/StickyComposer";
import ResultsScreen from "./pages/ResultsScreen";
import LoginPage from "./pages/LoginPage";
import {
  AuthShell,
  AuthInput,
  PrimaryButton,
  TextButton,
  FeedbackText,
} from "./components/AuthUI";
import { create, all } from "mathjs";
import { supabase } from "./lib/supabase";

const math = create(all);


const STORAGE_KEYS = {
  usage: "dams-usage-v1",
};

const mockSolution = {
  problem: "2+2",
  finalAnswer: "4",
  stepByStep: [
    "Read the expression: 2+2",
    "Identify the addition operation.",
    "Add the values together.",
    "Final result: 4",
  ],
  explanation: 'This problem uses addition. The values in "2+2" are combined to get 4.',
  quickCheck: "Recalculate 2+2 to verify that the answer is 4.",
  numberLine: {
    needed: true,
    start: 2,
    move: 2,
    end: 4,
    min: 0,
    max: 6,
  },
};

const HELP_FORM_URL = "https://forms.gle/sXDgx3oChgjLEUAv9";

async function loadProfile(user) {
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

function loadJSON(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}


function saveJSON(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore localStorage write errors
  }
}


function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeEmail(email) {
  return email.trim().toLowerCase();
}


function formatNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value);

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 10,
  });
}

function normalizeExpression(expression) {
  return expression
    .replace(/,/g, "")
    .replace(/[–—]/g, "-")
    .replace(/π/g, "pi")
    .replace(/÷/g, "/")
    .replace(/×/g, "*")
    .replace(/(\d|\))\s*[xX]\s*(?=\d|\()/g, "$1*")
    .replace(/\bln\s*\(/gi, "log(")
    .replace(/√\s*\(/g, "sqrt(")
    .replace(/√\s*([A-Za-z0-9.]+)/g, "sqrt($1)");
}

function formatMathResult(value) {
  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (value && typeof value === "object" && typeof value.toString === "function") {
    const asString = value.toString();
    const asNumber = Number(asString);

    if (Number.isFinite(asNumber) && !/[a-zA-Z]/.test(asString)) {
      return formatNumber(asNumber);
    }

    return asString;
  }

  return String(value);
}

function evaluateMathExpression(expression) {
  const normalized = normalizeExpression(expression);
  const node = math.parse(normalized);
  const compiled = node.compile();
  const result = compiled.evaluate();

  return { normalized, node, result };
}

function evaluateBasicExpression(expression) {
  const cleaned = normalizeExpression(expression);
  return Function(`"use strict"; return (${cleaned})`)();
}

function classifyExpression(expression) {
  const trimmed = expression.trim();

  if (!trimmed) {
    return { status: "empty", message: "" };
  }

  if (trimmed.includes("=")) {
    return {
      status: "unsupported",
      message: "DAMS AI can’t solve equations yet.",
    };
  }

  try {
    evaluateMathExpression(trimmed);
    return { status: "supported", message: "" };
  } catch {
    try {
      const simplified = math.simplify(normalizeExpression(trimmed)).toString();

      if (simplified && simplified !== "undefined") {
        return { status: "symbolic", message: "" };
      }
    } catch {
      // ignore simplify fallback errors
    }

    return {
      status: "invalid",
      message: "This is not a valid equation.",
    };
  }
}

function detectOperation(expression) {
  const normalized = normalizeExpression(expression);

  if (normalized.includes("+")) return "addition";
  if (normalized.includes("-")) return "subtraction";
  if (normalized.includes("*")) return "multiplication";
  if (normalized.includes("/")) return "division";
  return "calculation";
}

function generateSteps(expression, result) {
  const operation = detectOperation(expression);

  switch (operation) {
    case "addition":
      return [
        `Read the expression: ${expression}`,
        "Identify the addition operation.",
        "Add the values together.",
        `Final result: ${formatNumber(result)}`,
      ];
    case "subtraction":
      return [
        `Read the expression: ${expression}`,
        "Identify the subtraction operation.",
        "Subtract the second value from the first.",
        `Final result: ${formatNumber(result)}`,
      ];
    case "multiplication":
      return [
        `Read the expression: ${expression}`,
        "Identify the multiplication operation.",
        "Multiply the values together.",
        `Final result: ${formatNumber(result)}`,
      ];
    case "division":
      return [
        `Read the expression: ${expression}`,
        "Identify the division operation.",
        "Divide the numerator by the denominator.",
        `Final result: ${formatNumber(result)}`,
      ];
    default:
      return [
        `Read the expression: ${expression}`,
        "Evaluate using order of operations (PEMDAS).",
        `Final result: ${formatNumber(result)}`,
      ];
  }
}

function generateExplanation(expression, result) {
  const operation = detectOperation(expression);

  switch (operation) {
    case "addition":
      return `This problem uses addition. The values in "${expression}" are combined to get ${formatNumber(result)}.`;
    case "subtraction":
      return `This problem uses subtraction. The second quantity is taken away from the first to get ${formatNumber(result)}.`;
    case "multiplication":
      return `This problem uses multiplication. The values in "${expression}" are multiplied together to get ${formatNumber(result)}.`;
    case "division":
      return `This problem uses division. The numerator is divided by the denominator to get ${formatNumber(result)}.`;
    default:
      return `This expression was evaluated using standard mathematical order of operations to get ${formatNumber(result)}.`;
  }
}

function generateNumberLine(expression) {
  const cleaned = normalizeExpression(expression).replace(/\s+/g, "");

  const simpleAddMatch = cleaned.match(/^(-?\d+)\+(-?\d+)$/);
  const simpleSubMatch = cleaned.match(/^(-?\d+)-(-?\d+)$/);

  if (simpleAddMatch) {
    const first = Number(simpleAddMatch[1]);
    const second = Number(simpleAddMatch[2]);
    const result = first + second;

    if (
      !Number.isInteger(first) ||
      !Number.isInteger(second) ||
      first < 0 ||
      second < 0 ||
      result > 20
    ) {
      return { needed: false };
    }

    return {
      needed: true,
      start: first,
      move: second,
      end: result,
      min: 0,
      max: Math.max(result + 2, 6),
    };
  }

  if (simpleSubMatch) {
    const first = Number(simpleSubMatch[1]);
    const second = Number(simpleSubMatch[2]);
    const result = first - second;

    if (
      !Number.isInteger(first) ||
      !Number.isInteger(second) ||
      first < 0 ||
      second < 0 ||
      result < 0 ||
      first > 20
    ) {
      return { needed: false };
    }

    return {
      needed: true,
      start: first,
      move: -second,
      end: result,
      min: 0,
      max: Math.max(first + 2, 6),
    };
  }

  return { needed: false };
}

function solveExpression(expression) {
  const validation = classifyExpression(expression);

  if (validation.status === "unsupported") {
    return {
      problem: expression,
      finalAnswer: "DAMS AI can’t solve equations yet.",
      stepByStep: [
        `Read the expression: ${expression}`,
        "This looks like an equation, but equation solving is not enabled yet.",
      ],
      explanation:
        "Right now, DAMS AI can evaluate complex expressions and simplify symbolic expressions, but equation solving with an equals sign is coming next.",
      quickCheck: "Try entering a single expression for now, like sqrt(16), sin(pi / 2), or 2x + 3x.",
      numberLine: { needed: false },
    };
  }

  if (validation.status === "symbolic") {
    try {
      const simplified = math.simplify(normalizeExpression(expression)).toString();

      return {
        problem: expression,
        finalAnswer: simplified,
        stepByStep: [
          `Read the expression: ${expression}`,
          "Recognize this as symbolic math.",
          "Simplify the expression.",
          `Final result: ${simplified}`,
        ],
        explanation:
          "DAMS AI simplified the symbolic expression instead of evaluating it to a single number.",
        quickCheck: `Verify the simplified form: ${simplified}.`,
        numberLine: { needed: false },
      };
    } catch {
      return {
        problem: expression,
        finalAnswer: "This is not a valid equation.",
        stepByStep: [
          `Read the expression: ${expression}`,
          "The app could not parse this math input.",
        ],
        explanation:
          "Make sure your input uses valid mathematical symbols and structure.",
        quickCheck: "Double-check the formatting of the math expression and try again.",
        numberLine: { needed: false },
      };
    }
  }

  if (validation.status === "invalid") {
    return {
      problem: expression,
      finalAnswer: "This is not a valid equation.",
      stepByStep: [
        `Read the expression: ${expression}`,
        "The app could not parse this math input.",
      ],
      explanation:
        "Make sure your input uses valid numbers, parentheses, and supported math functions.",
      quickCheck: "Double-check the formatting of the math expression and try again.",
      numberLine: { needed: false },
    };
  }

  try {
    const { normalized, result } = evaluateMathExpression(expression);
    const formattedResult = formatMathResult(result);

    return {
      problem: expression,
      finalAnswer: formattedResult,
      stepByStep: [
        `Read the expression: ${expression}`,
        `Normalize it to: ${normalized}`,
        "Evaluate the expression using the math engine.",
        `Final result: ${formattedResult}`,
      ],
      explanation:
        "DAMS AI evaluated the expression using a real math parser, which allows more advanced functions and notation.",
      quickCheck: `Recalculate ${expression} to verify that the result is ${formattedResult}.`,
      numberLine: generateNumberLine(expression),
    };
  } catch {
    return {
      problem: expression,
      finalAnswer: "This is not a valid equation.",
      stepByStep: [
        `Read the expression: ${expression}`,
        "The app could not parse this math input.",
      ],
      explanation:
        "Make sure your input uses valid numbers, parentheses, and supported math functions.",
      quickCheck: "Double-check the formatting of the math expression and try again.",
      numberLine: { needed: false },
    };
  }
}

function getDailyLimit(user) {
  if (!user) return 5;
  return Infinity;
}

function getUsageEntry(usage, user) {
  const today = getTodayKey();

  if (!user) {
    const guestEntry = usage?.guest ?? { date: today, count: 0 };
    return guestEntry.date === today ? guestEntry : { date: today, count: 0 };
  }

  const userEntry = usage?.users?.[user.email] ?? { date: today, count: 0 };
  return userEntry.date === today ? userEntry : { date: today, count: 0 };
}

function getRemainingProblems(usage, user) {
  const dailyLimit = getDailyLimit(user);
  if (dailyLimit === Infinity) return Infinity;

  const entry = getUsageEntry(usage, user);
  return Math.max(dailyLimit - entry.count, 0);
}

function incrementUsage(usage, user) {
  const today = getTodayKey();
  const next = {
    guest: usage?.guest ?? { date: today, count: 0 },
    users: { ...(usage?.users ?? {}) },
  };

  if (!user) {
    const currentGuest = next.guest.date === today ? next.guest : { date: today, count: 0 };
    next.guest = {
      date: today,
      count: currentGuest.count + 1,
    };
    return next;
  }

  const currentUserEntry = next.users[user.email];
  const safeEntry =
    currentUserEntry && currentUserEntry.date === today
      ? currentUserEntry
      : { date: today, count: 0 };

  next.users[user.email] = {
    date: today,
    count: safeEntry.count + 1,
  };

  return next;
}


function getPlanLabel(plan) {
  if (plan === "elite") return "Elite";
  if (plan === "free") return "Free";
  return "Guest";
}

function getStatusLine(user, usage) {
  if (!user) {
    const remaining = getRemainingProblems(usage, null);
    return `${remaining}/5 problems left today`;
  }

  return "Unlimited Math Problems";
}

function DamsWordmark({ className = "" }) {
  const clipId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 520 120"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <text
            x="260"
            y="88"
            textAnchor="middle"
            fontFamily='"Helvetica Neue", Helvetica, Arial, sans-serif'
            fontSize="96"
            fontWeight="700"
            letterSpacing="10"
          >
            DAMS
          </text>
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: 14 }).map((_, index) => {
          const y = 18 + index * 7;
          return (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="520"
              y2={y}
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="3"
            />
          );
        })}
      </g>

      <text
        x="260"
        y="88"
        textAnchor="middle"
        fontFamily='"Helvetica Neue", Helvetica, Arial, sans-serif'
        fontSize="96"
        fontWeight="700"
        letterSpacing="10"
        fill="none"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2.5"
      >
        DAMS
      </text>
    </svg>
  );
}



function DamsSidebar({
  history,
  onSelect,
  onDeleteItem,
  onClearAll,
  isOpen,
  onClose,
  userName,
  userPlan,
  isGuest,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 lg:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-[70] flex h-screen w-[300px] flex-col border-r border-white/10 bg-[#0b0b0b] px-5 py-5 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
          >
            <span className="flex w-4 flex-col gap-1.5">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current opacity-80" />
              <span className="h-px w-full bg-current opacity-60" />
            </span>
          </button>

          <span className="text-[14px] font-light tracking-[0.18em] text-white/85">
            Recents
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] font-light uppercase tracking-[0.18em] text-white/40">
            Problem History
          </p>

          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] font-light uppercase tracking-[0.18em] text-white/45 transition hover:text-white"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {history.length ? (
            history.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-[#0f0f0f] px-3 py-3"
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-1 text-left text-[14px] font-light text-white/75 transition hover:text-white"
                >
                  <span className="block truncate">{item}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteItem(index)}
                  aria-label="Delete history item"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[12px] text-white/45 transition hover:border-white/20 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-[13px] font-light text-white/45">
              No recent problems yet.
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-white/10 pt-5">
          {!isGuest ? (
            <div className="text-[15px] font-medium text-white/92">{userName}</div>
          ) : null}
          <div className={`text-[12px] font-light uppercase tracking-[0.16em] text-white/45 ${!isGuest ? "mt-1" : ""}`}>
            {userPlan}
          </div>
        </div>
      </aside>
    </>
  );
}

function DamsTopBar({
  showHomeButton,
  authLabel,
  onMenuClick,
  onHomeClick,
  onAuthClick,
  onShopClick,
  onAboutClick,
  DamsWordmarkComponent,
}) {
  return (
    <header className="relative flex items-center px-5 py-4 sm:px-8 lg:px-12">
      <button
        type="button"
        aria-label="Toggle sidebar"
        onClick={onMenuClick}
        className="flex h-12 w-12 items-center justify-center border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white"
      >
        <span className="flex w-4 flex-col gap-1.5">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current opacity-80" />
          <span className="h-px w-full bg-current opacity-60" />
        </span>
      </button>

      {showHomeButton ? (
        <button
          type="button"
          onClick={onHomeClick}
          aria-label="Go to home page"
          className="absolute left-1/2 top-4 -translate-x-1/2 transition hover:opacity-100"
        >
          <DamsWordmarkComponent className="h-auto w-[150px] opacity-90" />
        </button>
      ) : null}

      <div className="ml-auto flex items-center gap-5">
        <button
          type="button"
          onClick={onAboutClick}
          className="text-[12px] font-light uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
        >
          About
        </button>
        <button
          type="button"
          onClick={onShopClick}
          className="text-[12px] font-light uppercase tracking-[0.24em] text-white/55 transition hover:text-white"
        >
          Shop
        </button>
        <button
          type="button"
          onClick={onAuthClick}
          className="text-[12px] font-light uppercase tracking-[0.24em] text-white/75 transition hover:text-white"
        >
          {authLabel}
        </button>
      </div>
    </header>
  );
}

function MathKeyboard({ onInsert, onBackspace, onClear }) {
  const rows = [
    ["x", "y", "z", "(", ")", "^", "="],
    ["7", "8", "9", "+", "-", "*", "/"],
    ["4", "5", "6", "sqrt(", "pi", "log(", "ln("],
    ["1", "2", "3", "sin(", "cos(", "tan(", "."],
    ["0", ",", "%", "<", ">", "<=", ">="],
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080808] p-3 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-light uppercase tracking-[0.18em] text-white/40">
          Math Keyboard
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-light uppercase tracking-[0.18em] text-white/45 transition hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-7 gap-2">
            {row.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onInsert(value)}
                className="rounded-xl border border-white/10 bg-[#101010] px-3 py-3 text-[13px] font-light text-white/80 transition hover:border-white/20 hover:bg-[#151515] hover:text-white"
              >
                {value}
              </button>
            ))}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onBackspace}
            className="rounded-xl border border-white/10 bg-[#101010] px-3 py-3 text-[13px] font-light uppercase tracking-[0.18em] text-white/80 transition hover:border-white/20 hover:bg-[#151515] hover:text-white"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => onInsert(" ")}
            className="rounded-xl border border-white/10 bg-[#101010] px-3 py-3 text-[13px] font-light uppercase tracking-[0.18em] text-white/80 transition hover:border-white/20 hover:bg-[#151515] hover:text-white"
          >
            Space
          </button>
        </div>
      </div>
    </div>
  );
}

function DamsComposer({
  query,
  setQuery,
  onSubmit,
  landing = false,
  error,
  onOpenLogin,
  onOpenUpgrade,
  keyboardPosition = "below",
}) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const insertValue = (value) => {
    setQuery((prev) => `${prev}${value}`);
  };

  const backspaceValue = () => {
    setQuery((prev) => prev.slice(0, -1));
  };

  const clearValue = () => {
    setQuery("");
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      {keyboardOpen && keyboardPosition === "above" ? (
        <div className="mb-3">
          <MathKeyboard onInsert={insertValue} onBackspace={backspaceValue} onClear={clearValue} />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter Math Problem Here"
              className={`h-16 w-full border border-white/12 bg-[#0b0b0b] px-6 pr-16 text-[18px] font-light tracking-[0.02em] text-white/90 outline-none placeholder:text-white/34 focus:border-white/24 ${
                landing ? "text-center sm:text-center" : ""
              }`}
            />

            <button
              type="button"
              onClick={() => setKeyboardOpen((prev) => !prev)}
              aria-label="Toggle math keyboard"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#101010] text-[14px] text-white/70 transition hover:border-white/20 hover:text-white"
            >
              ⌨
            </button>
          </div>

          {!landing ? (
            <button
              type="submit"
              className="h-16 border border-white/12 bg-[#0b0b0b] px-8 text-[13px] font-light uppercase tracking-[0.24em] text-white/78 transition hover:border-white/20 hover:text-white sm:min-w-36"
            >
              Solve
            </button>
          ) : null}
        </div>

        {keyboardOpen && keyboardPosition === "below" ? (
          <MathKeyboard onInsert={insertValue} onBackspace={backspaceValue} onClear={clearValue} />
        ) : null}

        <div
          className={`min-h-[20px] text-[12px] font-light tracking-[0.06em] text-white/55 ${
            landing ? "text-center" : "pl-1"
          }`}
        >
          <ComposerError
            error={error}
            onOpenLogin={onOpenLogin}
            onOpenUpgrade={onOpenUpgrade}
          />
        </div>
      </div>
    </form>
  );
}

function DamsLandingScreen({
  query,
  setQuery,
  onSubmit,
  error,
  statusLine,
  onOpenLogin,
  onOpenUpgrade,
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-5 pb-16">
      <div className="-mt-20 flex w-full max-w-3xl flex-col items-center">
        <img
          src={damsLogo}
          alt="DAMS logo"
          className="mb-0 h-auto w-[280px] max-w-[72vw] object-contain sm:w-[340px] md:w-[390px]"
        />

        <div className="-mt-20 mb-5 rounded-full border border-white/10 bg-[#0a0a0a] px-5 py-3">
          <p className="text-center text-[10px] font-light tracking-[0.18em] text-white/55">
            {statusLine}
          </p>
        </div>

        <div className="w-full max-w-[620px]">
          <DamsComposer
            query={query}
            setQuery={setQuery}
            onSubmit={onSubmit}
            landing
            error={error}
            onOpenLogin={onOpenLogin}
            onOpenUpgrade={onOpenUpgrade}
            keyboardPosition="below"
          />
        </div>

        <p className="mt-6 text-center text-[10px] font-light tracking-[0.18em] text-white/38">
          DAMS can solve 99.7% of all math problems.
        </p>
      </div>
    </section>
  );
}

function DamsStickyComposer({
  query,
  setQuery,
  onSubmit,
  sidebarOpen,
  error,
  onOpenLogin,
  onOpenUpgrade,
}) {
  return (
    <div
      className={`fixed bottom-0 right-0 z-[60] border-t border-white/10 bg-[#040404] transition-all duration-300 ${
        sidebarOpen ? "left-[300px]" : "left-0"
      }`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-[980px]">
          <DamsComposer
            query={query}
            setQuery={setQuery}
            onSubmit={onSubmit}
            error={error}
            onOpenLogin={onOpenLogin}
            onOpenUpgrade={onOpenUpgrade}
            keyboardPosition="above"
          />
        </div>
      </div>
    </div>
  );
}

function ShopPage() {
  return (
    <AuthShell title="SHOP" subtitle="Coming Soon" />
  );
}

function AboutPage({ helpUrl = HELP_FORM_URL }) {
  return (
    <section className="mx-auto flex w-full max-w-[980px] flex-1 flex-col px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="border border-white/10 bg-[#050505] px-5 py-5 sm:px-8 sm:py-8">
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-6">
            <h1 className="text-[12px] font-light uppercase tracking-[0.28em] text-white/42">
              ABOUT
            </h1>
            <p className="mt-5 text-[28px] font-medium text-white">What is DAMS?</p>
            <p className="mt-3 text-[15px] font-light leading-8 text-white/58">
              DAMS AI is an educational tool designed to help students learn how to solve math problems step-by-step. It can evaluate a wide range of mathematical expressions, from basic arithmetic to more complex functions, and provides detailed explanations and visualizations to support learning. Whether you're a student looking for homework help or a lifelong learner exploring new math concepts, DAMS AI is here to assist you on your mathematical journey. Please note that all features are currently free to use during the beta phase, and we welcome your feedback!
            </p>
          </div>

          <div className="border border-white/10 bg-[#080808] px-5 py-5">
            <h2 className="text-[12px] font-light uppercase tracking-[0.24em] text-white/42">
              TERMS & CONDITIONS
            </h2>
            <p className="mt-3 text-[14px] font-light leading-7 text-white/55">
              By using DAMS AI, you agree to use the service lawfully, responsibly, and for personal or educational purposes only. You are responsible for reviewing and verifying any results before relying on them. DAMS AI may update, limit, suspend, or discontinue features at any time without notice. Use of the service is at your own risk.
            </p>
          </div>

          <div className="border border-white/10 bg-[#080808] px-5 py-5">
            <h2 className="text-[12px] font-light uppercase tracking-[0.24em] text-white/42">
              PRIVACY
            </h2>
            <p className="mt-3 text-[14px] font-light leading-7 text-white/55">
              DAMS AI may collect and store limited account information, problem history, usage data, and other information needed to operate and improve the service. This information may be stored locally in your browser and through third-party service providers that support authentication, hosting, and core app functionality. DAMS AI does not guarantee that information stored through the service will always be available, complete, or secure. By using the service, you consent to this collection and use of information for operating and improving DAMS AI.
            </p>
          </div>

          <div className="border border-white/10 bg-[#080808] px-5 py-5">
            <h2 className="text-[12px] font-light uppercase tracking-[0.24em] text-white/42">
              DISCLAIMER
            </h2>
            <p className="mt-3 text-[14px] font-light leading-7 text-white/55">
              DAMS AI is a beta educational tool and is provided for general informational purposes only. Results may be incomplete, inaccurate, or outdated, and should not be treated as professional, legal, financial, medical, academic, or other official advice. Users should independently verify all outputs before submitting work, making decisions, or relying on the service in any important context. DAMS AI and its operators are not responsible for any loss, damage, or consequences resulting from use of the service.
            </p>
          </div>

          <div className="border border-white/10 bg-[#080808] px-5 py-5">
            <h2 className="text-[12px] font-light uppercase tracking-[0.24em] text-white/42">
              SUPPORT
            </h2>
            <p className="mt-3 text-[14px] font-light leading-7 text-white/55">
              Use the form below to submit any questions, feedback, or issues you have with DAMS AI. Your input is invaluable in helping us improve the service and address any problems. We aim to respond to all inquiries as quickly as possible, but please allow some time for us to review and get back to you.
            </p>
            <div className="mt-5">
              <a
                href={helpUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center border border-white/12 bg-[#0b0b0b] px-5 py-3 text-[12px] font-light uppercase tracking-[0.22em] text-white/78 transition hover:border-white/20 hover:text-white"
              >
                Open Support Form
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HelpFooterLink({ href, lifted = false }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`fixed right-6 z-[80] text-[10px] font-light uppercase tracking-[0.24em] text-white/28 transition hover:text-white/60 ${
        lifted ? "bottom-28" : "bottom-5"
      }`}
    >
      Help
    </a>
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [submittedProblem, setSubmittedProblem] = useState("");
  const [history, setHistory] = useState(["2+2"]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputError, setInputError] = useState({ type: "", message: "" });

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usage, setUsage] = useState(() =>
    loadJSON(STORAGE_KEYS.usage, {
      guest: { date: getTodayKey(), count: 0 },
      users: {},
    })
  );

  const [page, setPage] = useState("home");

  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    plan: "free",
  });

  const [forgotEmail, setForgotEmail] = useState("");
  const [accountEmailForm, setAccountEmailForm] = useState({ email: "" });
  const [accountPasswordForm, setAccountPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");



  useEffect(() => {
    saveJSON(STORAGE_KEYS.usage, usage);
  }, [usage]);

  useEffect(() => {
    let mounted = true;

    const bootAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const nextSession = data.session;

      if (!mounted) return;

      setSession(nextSession);

      if (nextSession?.user) {
        try {
          const nextProfile = await loadProfile(nextSession.user);
          if (mounted) {
            setProfile(nextProfile);
          }
        } catch (error) {
          if (mounted) {
            setAuthError(error.message || "Could not load profile.");
          }
        }
      } else if (mounted) {
        setProfile(null);
      }
    };

    bootAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user) {
        try {
          const nextProfile = await loadProfile(nextSession.user);
          setProfile(nextProfile);
        } catch (error) {
          setAuthError(error.message || "Could not load profile.");
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentUser = useMemo(() => {
    if (!session?.user) return null;

    return {
      id: session.user.id,
      email: session.user.email ?? profile?.email ?? "",
      firstName: profile?.first_name ?? session.user.user_metadata?.first_name ?? "",
      lastName: profile?.last_name ?? session.user.user_metadata?.last_name ?? "",
      plan: "free",
    };
  }, [session, profile]);

  useEffect(() => {
    setAccountEmailForm({ email: currentUser?.email || "" });
  }, [currentUser]);

  const isLoggedIn = Boolean(session?.user);
  const hasResult = Boolean(submittedProblem);
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Guest";
  const userPlan = getPlanLabel(currentUser?.plan);
  const remainingProblems = getRemainingProblems(usage, currentUser);
  const statusLine = getStatusLine(currentUser, usage);

  const solution = useMemo(() => {
    if (!submittedProblem) return mockSolution;
    return solveExpression(submittedProblem);
  }, [submittedProblem]);

  const resetAuthFeedback = () => {
    setAuthError("");
    setAuthMessage("");
  };

  const clearInputError = () => {
    setInputError({ type: "", message: "" });
  };

  const goToPage = (nextPage) => {
    resetAuthFeedback();
    setPage(nextPage);
    setSidebarOpen(false);
  };

  const sendHome = () => {
    setPage("home");
    setSubmittedProblem("");
    setQuery("");
    clearInputError();
    setAuthError("");
    setAuthMessage("");
    setIsLoading(false);
    setSidebarOpen(false);
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    if (inputError.type || inputError.message) {
      clearInputError();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      clearInputError();
      return;
    }

    const validation = classifyExpression(trimmed);

    if (validation.status !== "supported") {
      setInputError({ type: "text", message: validation.message });
      return;
    }

    if (getRemainingProblems(usage, currentUser) <= 0) {
      if (!currentUser) {
        setInputError({ type: "guest-limit", message: "" });
      } else {
        setInputError({ type: "free-limit", message: "" });
      }
      return;
    }

    clearInputError();
    setIsLoading(true);

    setTimeout(() => {
      setSubmittedProblem(trimmed);
      setHistory((prev) =>
        [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 12)
      );
      setUsage((prev) => incrementUsage(prev, currentUser));
      setQuery("");
      setIsLoading(false);
      setSidebarOpen(false);
      setPage("home");
    }, 900);
  };

  const handleHistoryClick = (problem) => {
    clearInputError();
    setIsLoading(true);

    setTimeout(() => {
      setSubmittedProblem(problem);
      setSidebarOpen(false);
      setIsLoading(false);
      setPage("home");
    }, 500);
  };

  const handleAuthClick = () => {
    if (isLoggedIn) {
      goToPage("account");
    } else {
      goToPage("login");
    }
  };

  const handleAboutClick = () => {
    goToPage("about");
  };

  const handleShopClick = () => {
    goToPage("shop");
  };

  const handleDeleteHistoryItem = (indexToDelete) => {
    setHistory((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    resetAuthFeedback();

    const email = sanitizeEmail(loginForm.identifier);
    const password = loginForm.password;

    if (!email || !password) {
      setAuthError("Please enter your login information.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message || "Incorrect login information.");
      return;
    }

    setLoginForm({ identifier: "", password: "" });
    sendHome();
  };

  const handleGoogleContinue = () => {
    resetAuthFeedback();
    setAuthMessage("Google login is coming soon");
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    resetAuthFeedback();

    const firstName = signupForm.firstName.trim();
    const lastName = signupForm.lastName.trim();
    const email = sanitizeEmail(signupForm.email);
    const password = signupForm.password;

    if (!firstName || !lastName || !email || !password) {
      setAuthError("Please fill out every field.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setAuthError("Please enter a valid email.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Your password must be at least 6 characters.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      setAuthError(
        error.message === "email rate limit exceeded"
          ? "Too many email requests were sent. Wait a little bit, then try again."
          : error.message || "Could not create account."
      );
      return;
    }

    setSignupForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      plan: "free",
    });

    sendHome();
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    resetAuthFeedback();

    const email = sanitizeEmail(forgotEmail);

    if (!email) {
      setAuthError("Please enter your email.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setAuthError(
        error.message === "email rate limit exceeded"
          ? "Too many email requests were sent. Wait a little bit, then try again."
          : error.message || "Could not send reset link."
      );
      return;
    }

    setForgotEmail("");
    setAuthMessage("If that email exists, a reset link has been sent.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sendHome();
  };

  const handleChangeEmail = async (event) => {
    event.preventDefault();
    resetAuthFeedback();

    const nextEmail = sanitizeEmail(accountEmailForm.email);

    if (!nextEmail) {
      setAuthError("Please enter a new email.");
      return;
    }

    if (!nextEmail.includes("@") || !nextEmail.includes(".")) {
      setAuthError("Please enter a valid email.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      email: nextEmail,
    });

    if (error) {
      setAuthError(error.message || "Could not update email.");
      return;
    }

    setAuthMessage("Check your email to confirm the change.");
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    resetAuthFeedback();

    const { newPassword } = accountPasswordForm;

    if (!newPassword) {
      setAuthError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setAuthError("Your new password must be at least 6 characters.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAuthError(error.message || "Could not update password.");
      return;
    }

    setAccountPasswordForm({
      currentPassword: "",
      newPassword: "",
    });

    setAuthMessage("Your password has been updated.");
  };

  const handleDeleteAccount = () => {
    resetAuthFeedback();
    setAuthMessage("Delete account is coming later.");
  };

  const handleUpgradeToElite = () => {
    resetAuthFeedback();
    setAuthMessage("Elite is coming soon.");
    setPage("upgrade");
  };

  const handleCancelElite = () => {
    resetAuthFeedback();
    setAuthMessage("Elite is coming soon.");
    setPage("manageSubscription");
  };

  const handleOpenSubscriptionPage = () => {
    goToPage("upgrade");
  };

  const showHomeButton = hasResult || page !== "home";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <DamsSidebar
          history={history}
          onSelect={handleHistoryClick}
          onDeleteItem={handleDeleteHistoryItem}
          onClearAll={handleClearHistory}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={userName}
          userPlan={userPlan}
          isGuest={!isLoggedIn}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <DamsTopBar
            showHomeButton={showHomeButton}
            authLabel={isLoggedIn ? "ACCOUNT" : "LOGIN"}
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
            onHomeClick={sendHome}
            onAuthClick={handleAuthClick}
            onShopClick={handleShopClick}
            onAboutClick={handleAboutClick}
            DamsWordmarkComponent={DamsWordmark}
          />

          <main
            className={`relative flex flex-1 flex-col transition-all duration-300 ${
              page === "home" && hasResult ? "pb-40" : ""
            } ${sidebarOpen ? "lg:pl-[280px]" : ""}`}
          >
            {page === "login" ? (
              <LoginPage
                loginForm={loginForm}
                setLoginForm={setLoginForm}
                onSubmit={handleLogin}
                onCreateAccount={() => goToPage("signup")}
                onForgotPassword={() => goToPage("forgotPassword")}
                onGoogleContinue={handleGoogleContinue}
                authError={authError}
                authMessage={authMessage}
              />
            ) : page === "signup" ? (
              <CreateAccountPage
                signupForm={signupForm}
                setSignupForm={setSignupForm}
                onSubmit={handleCreateAccount}
                onBackToLogin={() => goToPage("login")}
                authError={authError}
                authMessage={authMessage}
              />
            ) : page === "forgotPassword" ? (
              <ForgotPasswordPage
                forgotEmail={forgotEmail}
                setForgotEmail={setForgotEmail}
                onSubmit={handleForgotPassword}
                onBackToLogin={() => goToPage("login")}
                authError={authError}
                authMessage={authMessage}
              />
            ) : page === "account" ? (
              <AccountPage
                user={currentUser}
                remainingProblems={remainingProblems}
                onOpenSubscriptionPage={handleOpenSubscriptionPage}
                onLogout={handleLogout}
                accountEmailForm={accountEmailForm}
                setAccountEmailForm={setAccountEmailForm}
                onChangeEmail={handleChangeEmail}
                accountPasswordForm={accountPasswordForm}
                setAccountPasswordForm={setAccountPasswordForm}
                onChangePassword={handleChangePassword}
                onDeleteAccount={handleDeleteAccount}
                authError={authError}
                authMessage={authMessage}
              />
            ) : page === "upgrade" ? (
              <UpgradePage
                onUpgrade={handleUpgradeToElite}
                onBackToAccount={() => goToPage("account")}
              />
            ) : page === "manageSubscription" ? (
              <ManageSubscriptionPage
                onCancelElite={handleCancelElite}
                onBackToAccount={() => goToPage("account")}
              />
            ) : page === "shop" ? (
              <ShopPage />
            ) : page === "about" ? (
              <AboutPage helpUrl={HELP_FORM_URL} />
            ) : !hasResult ? (
              isLoading ? (
                <LoadingScreen />
              ) : (
                <DamsLandingScreen
                  query={query}
                  setQuery={handleQueryChange}
                  onSubmit={handleSubmit}
                  error={inputError}
                  statusLine={statusLine}
                  onOpenLogin={() => goToPage("login")}
                  onOpenUpgrade={() => goToPage("upgrade")}
                />
              )
            ) : isLoading ? (
              <LoadingScreen />
            ) : (
              <ResultsScreen solution={solution} />
            )}
          </main>
        </div>
      </div>

      {page === "home" && hasResult && (
        <DamsStickyComposer
          query={query}
          setQuery={handleQueryChange}
          onSubmit={handleSubmit}
          sidebarOpen={sidebarOpen}
          error={inputError}
          onOpenLogin={() => goToPage("login")}
          onOpenUpgrade={() => goToPage("upgrade")}
        />
      )}

      <HelpFooterLink href={HELP_FORM_URL} lifted={page === "home" && hasResult} />
    </div>
  );
}

function ComposerError({ error, onOpenLogin, onOpenUpgrade }) {
  if (!error?.type && !error?.message) {
    return null;
  }

  if (error.type === "guest-limit") {
    return (
      <>
        Limit reached,{" "}
        <button
          type="button"
          onClick={onOpenLogin}
          className="underline underline-offset-4 transition hover:text-white"
        >
          login/sign up
        </button>{" "}
        to continue.
      </>
    );
  }

  if (error.type === "free-limit") {
    return <>Unlimited math problems are enabled during the beta.</>;
  }

  return <>{error.message}</>;
}


function CreateAccountPage({
  signupForm,
  setSignupForm,
  onSubmit,
  onBackToLogin,
  authError,
  authMessage,
}) {
  return (
    <AuthShell title="CREATE ACCOUNT">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            value={signupForm.firstName}
            onChange={(event) =>
              setSignupForm((prev) => ({
                ...prev,
                firstName: event.target.value,
              }))
            }
            placeholder="First Name"
          />

          <AuthInput
            value={signupForm.lastName}
            onChange={(event) =>
              setSignupForm((prev) => ({
                ...prev,
                lastName: event.target.value,
              }))
            }
            placeholder="Last Name"
          />
        </div>

        <AuthInput
          value={signupForm.email}
          onChange={(event) =>
            setSignupForm((prev) => ({
              ...prev,
              email: event.target.value,
            }))
          }
          placeholder="Email"
        />

        <AuthInput
          type="password"
          value={signupForm.password}
          onChange={(event) =>
            setSignupForm((prev) => ({
              ...prev,
              password: event.target.value,
            }))
          }
          placeholder="Create Password"
        />

        <div className="space-y-3 pt-2">
          <p className="text-[12px] font-light uppercase tracking-[0.18em] text-white/42">
            Choose Plan
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setSignupForm((prev) => ({
                  ...prev,
                  plan: "free",
                }))
              }
              className="border border-white/30 bg-[#111111] px-4 py-4 text-left transition"
            >
              <div className="text-[14px] font-medium text-white/92">Free</div>
              <div className="mt-2 text-[12px] font-light leading-6 text-white/48">
                Unlimited Math Problems
              </div>
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed border border-white/10 bg-[#0b0b0b] px-4 py-4 text-left opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-medium text-white/92">Elite</div>
                <div className="text-[12px] font-light uppercase tracking-[0.14em] text-white/55">
                  $10 / month
                </div>
              </div>
              <div className="mt-2 text-[12px] font-light leading-6 text-white/48">
                Coming Soon.
              </div>
            </button>
          </div>
        </div>

        <PrimaryButton type="submit">Create Account</PrimaryButton>

        <div className="flex justify-center pt-1">
          <TextButton onClick={onBackToLogin}>Back to Login</TextButton>
        </div>

        <FeedbackText error={authError} message={authMessage} />
      </form>
    </AuthShell>
  );
}

function ForgotPasswordPage({
  forgotEmail,
  setForgotEmail,
  onSubmit,
  onBackToLogin,
  authError,
  authMessage,
}) {
  return (
    <AuthShell
      title="FORGOT PASSWORD"
      subtitle="Enter your email and we’ll send you a reset link."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          value={forgotEmail}
          onChange={(event) => setForgotEmail(event.target.value)}
          placeholder="Email"
        />

        <PrimaryButton type="submit">Send Reset Link</PrimaryButton>

        <div className="flex justify-center pt-1">
          <TextButton onClick={onBackToLogin}>Back to Login</TextButton>
        </div>

        <FeedbackText error={authError} message={authMessage} />
      </form>
    </AuthShell>
  );
}


function AccountPage({
  user,
  remainingProblems,
  onOpenSubscriptionPage,
  onLogout,
  accountEmailForm,
  setAccountEmailForm,
  onChangeEmail,
  accountPasswordForm,
  setAccountPasswordForm,
  onChangePassword,
  onDeleteAccount,
  authError,
  authMessage,
}) {
  if (!user) {
    return (
      <AuthShell title="ACCOUNT" subtitle="Please log in first.">
        <FeedbackText error="You must be logged in to view this page." message="" />
      </AuthShell>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[980px] flex-1 flex-col px-5 pt-6 sm:px-8 sm:pt-8">
      <div className="border border-white/10 bg-[#050505] px-5 py-5 sm:px-8 sm:py-8">
        <div className="border-b border-white/10 pb-6">
          <h1 className="text-[12px] font-light uppercase tracking-[0.28em] text-white/42">
            ACCOUNT
          </h1>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[28px] font-medium text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="mt-2 text-[14px] font-light text-white/55">{user.email}</p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[12px] font-light uppercase tracking-[0.18em] text-white/42">
                Plan
              </p>
              <p className="mt-2 text-[16px] font-light text-white/82">
                Free Beta
              </p>
              <p className="mt-2 text-[12px] font-light text-white/48">
                Unlimited Math Problems
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-6">
          <AccountCard
            title="ELITE"
            description="Elite subscriptions will be launching soon with additional features and benefits"
          >
            <PrimaryButton onClick={onOpenSubscriptionPage}>Coming Soon</PrimaryButton>
          </AccountCard>

          <AccountCard title="CHANGE EMAIL" description="Update your account email.">
            <form onSubmit={onChangeEmail} className="space-y-4">
              <AuthInput
                value={accountEmailForm.email}
                onChange={(event) =>
                  setAccountEmailForm({
                    email: event.target.value,
                  })
                }
                placeholder="New Email"
              />
              <PrimaryButton type="submit">Save Email</PrimaryButton>
            </form>
          </AccountCard>

          <AccountCard title="CHANGE PASSWORD" description="Update your password.">
            <form onSubmit={onChangePassword} className="space-y-4">
              <AuthInput
                type="password"
                value={accountPasswordForm.currentPassword}
                onChange={(event) =>
                  setAccountPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: event.target.value,
                  }))
                }
                placeholder="Current Password"
              />

              <AuthInput
                type="password"
                value={accountPasswordForm.newPassword}
                onChange={(event) =>
                  setAccountPasswordForm((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
                placeholder="New Password"
              />

              <PrimaryButton type="submit">Save Password</PrimaryButton>
            </form>
          </AccountCard>

          <AccountCard
            title="DELETE ACCOUNT"
            description="This permanently removes your account from this browser."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton onClick={onDeleteAccount}>Delete Account</PrimaryButton>
              <PrimaryButton onClick={onLogout}>Log Out</PrimaryButton>
            </div>
          </AccountCard>

          <FeedbackText error={authError} message={authMessage} />
        </div>
      </div>
    </section>
  );
}

function AccountCard({ title, description, children }) {
  return (
    <div className="border border-white/10 bg-[#080808] px-4 py-5 sm:px-5">
      <h2 className="text-[12px] font-light uppercase tracking-[0.24em] text-white/42">
        {title}
      </h2>
      <p className="mt-3 text-[14px] font-light leading-7 text-white/55">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}


function UpgradePage({ onUpgrade, onBackToAccount }) {
  return (
    <AuthShell
      title="ELITE"
      subtitle="Coming soon with additional features and benefits"
    >
      <div className="space-y-5">
        <div className="border border-white/10 bg-[#080808] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[15px] font-medium text-white/92">Elite</div>
            <div className="text-[12px] font-light uppercase tracking-[0.14em] text-white/55">
              $10 / month
            </div>
          </div>

          <p className="mt-3 text-[14px] font-light leading-7 text-white/55">
            
          </p>
        </div>

        <PrimaryButton onClick={onUpgrade}>Coming Soon</PrimaryButton>

        <div className="flex justify-center">
          <TextButton onClick={onBackToAccount}>Back to Account</TextButton>
        </div>
      </div>
    </AuthShell>
  );
}


function ManageSubscriptionPage({ onCancelElite, onBackToAccount }) {
  return (
    <AuthShell
      title="MANAGE SUBSCRIPTION"
      subtitle="Elite subscriptions are coming soon."
    >
      <div className="space-y-5">
        <div className="border border-white/10 bg-[#080808] px-5 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[15px] font-medium text-white/92">Elite</div>
            <div className="text-[12px] font-light uppercase tracking-[0.14em] text-white/55">
              Coming Soon
            </div>
          </div>

          <p className="mt-3 text-[14px] font-light leading-7 text-white/55">
            Free beta currently includes unlimited math problems.
          </p>
        </div>

        <PrimaryButton onClick={onCancelElite}>Coming Soon</PrimaryButton>

        <div className="flex justify-center">
          <TextButton onClick={onBackToAccount}>Back to Account</TextButton>
        </div>
      </div>
    </AuthShell>
  );
}

export default App;