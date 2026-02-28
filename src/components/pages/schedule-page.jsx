import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Table2,
  RotateCcw,
  Share2,
  Check,
  LayoutGrid,
} from "lucide-react";
import { Button } from "../ui/button";
import { Header } from "../layout/header";
import { Footer } from "../ui/footer";
import { useAssignments } from "../assignments/context/AssignmentsContext";
import authService from "../../services/authService";
import { getAssignablePeople } from "../../services/assignablePeopleService";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Return every Sunday (YYYY-MM-DD) within [start, end] inclusive */
function getSundaysInRange(start, end) {
  const sundays = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  // move to first Sunday
  while (cursor.getUTCDay() !== 0) cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= end) {
    sundays.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return sundays;
}

/** Format a YYYY-MM-DD string for the sticky date row label */
function formatSundayRow(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

/** YYYY-MM-DD of the nearest upcoming Sunday (or today if today is Sunday) */
function nearestSundayString() {
  const d = todayUTC();
  const diff = (7 - d.getUTCDay()) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Today's date at midnight UTC */
function todayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** YYYY-MM-DD string of today */
function todayString() {
  return todayUTC().toISOString().slice(0, 10);
}

/** Return a {start, end, label} window for the given mode & cursor date */
function getWindow(mode, cursor) {
  const y = cursor.getUTCFullYear();
  const m = cursor.getUTCMonth(); // 0-based

  if (mode === "weekly") {
    // find Sunday of the week containing cursor
    const day = cursor.getUTCDay();
    const sunday = new Date(cursor);
    sunday.setUTCDate(cursor.getUTCDate() - day);
    const end = new Date(sunday);
    end.setUTCDate(sunday.getUTCDate() + 6);
    return {
      start: sunday,
      end,
      label: `Week of ${sunday.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}`,
    };
  }

  if (mode === "monthly") {
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    return {
      start,
      end,
      label: cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  }

  if (mode === "quarterly") {
    const q = Math.floor(m / 3);
    const start = new Date(Date.UTC(y, q * 3, 1));
    const end = new Date(Date.UTC(y, q * 3 + 3, 0));
    return {
      start,
      end,
      label: `Q${q + 1} ${y}`,
    };
  }

  // annual
  const start = new Date(Date.UTC(y, 0, 1));
  const end = new Date(Date.UTC(y, 11, 31));
  return { start, end, label: String(y) };
}

/** Advance cursor by one period in the given mode */
function advanceCursor(cursor, mode, direction) {
  const d = new Date(cursor);
  if (mode === "weekly") d.setUTCDate(d.getUTCDate() + direction * 7);
  else if (mode === "monthly") d.setUTCMonth(d.getUTCMonth() + direction);
  else if (mode === "quarterly") d.setUTCMonth(d.getUTCMonth() + direction * 3);
  else d.setUTCFullYear(d.getUTCFullYear() + direction);
  return d;
}

// ─── Component ───────────────────────────────────────────────────────────────

const VIEW_MODES = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" },
];

export function SchedulePage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const { assignments, loading } = useAssignments();

  const [mode, setMode] = useState("monthly");
  const [cursor, setCursor] = useState(() => todayUTC());
  const [emailMap, setEmailMap] = useState({});
  const [copied, setCopied] = useState(false);
  const [layoutView, setLayoutView] = useState("table"); // "table" | "cards"

  const handleShareLink = () => {
    const url = `${window.location.origin}/public/schedule`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }; // name (lowercase) → email

  useEffect(() => {
    getAssignablePeople(false)
      .then((people) => {
        const map = {};
        for (const p of people ?? []) {
          if (p.name && p.email) map[p.name.toLowerCase()] = p.email;
        }
        setEmailMap(map);
      })
      .catch(() => {});
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────

  const { start, end, label } = useMemo(() => getWindow(mode, cursor), [mode, cursor]);

  const sundaysInWindow = useMemo(() => getSundaysInRange(start, end), [start, end]);

  // Build a lookup: dateString → Map<role, string (comma-joined people)>
  const assignmentMap = useMemo(() => {
    const map = {};
    if (!assignments) return map;
    for (const service of assignments) {
      const roleMap = {};
      for (const { role, person } of service.assignments ?? []) {
        if (!roleMap[role]) roleMap[role] = [];
        if (person) roleMap[role].push(person);
      }
      // Convert arrays to comma-joined strings (empty string if none assigned)
      map[service.dateString] = Object.fromEntries(
        Object.entries(roleMap).map(([role, people]) => [role, people.join(", ")])
      );
    }
    return map;
  }, [assignments]);

  // Collect all unique roles in role_order from services within the window
  const allRoles = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    // Use all assignments to preserve order across dates
    if (!assignments) return ordered;
    for (const service of assignments) {
      for (const { role } of service.assignments ?? []) {
        if (!seen.has(role)) {
          seen.add(role);
          ordered.push(role);
        }
      }
    }
    return ordered;
  }, [assignments]);

  const today = todayString();
  const nearest = nearestSundayString();

  // Ref attached to the nearest/today Sunday element; scrolled into view after load
  const nearestRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    const el = nearestRef.current;
    if (!el) return;
    const id = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }, 120);
    return () => clearTimeout(id);
  }, [loading, layoutView, mode]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handlePrev = () => setCursor((c) => advanceCursor(c, mode, -1));
  const handleNext = () => setCursor((c) => advanceCursor(c, mode, +1));
  const handleToday = () => setCursor(todayUTC());
  const handleLogout = () => authService.logout();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Service Schedule"
        subtitle="View role assignments across services"
        user={user}
        onLogout={handleLogout}
        showNotifications={true}
        showUserInfo={true}
        showLogout={true}
      />

      <main className="flex-1 max-w-full px-3 sm:px-4 py-4 sm:py-6 mx-auto w-full">
        {/* ── Controls bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-4 sm:mb-5">
          {/* Row 1 on mobile: back + share */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-gray-600"
              onClick={() => navigate("/dashboard")}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Dashboard</span>
            </Button>

            {/* Share — visible on mobile in this row */}
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1.5 h-8 sm:hidden ${
                copied ? "text-green-600 border-green-400" : "text-gray-600"
              }`}
              onClick={handleShareLink}
              title="Copy public schedule link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm self-stretch sm:self-auto">
            {VIEW_MODES.map(({ key, label: modeLabel }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  mode === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {modeLabel}
              </button>
            ))}
          </div>

          {/* Period navigator + Today + Share (desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="flex-1 text-center text-sm font-semibold text-gray-800 sm:min-w-[140px] sm:flex-none">
              {label}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-gray-600 h-8 shrink-0"
              onClick={handleToday}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Today</span>
            </Button>
            {/* Share — desktop only */}
            <Button
              variant="outline"
              size="sm"
              className={`hidden sm:flex items-center gap-1.5 h-8 ${
                copied ? "text-green-600 border-green-400" : "text-gray-600"
              }`}
              onClick={handleShareLink}
              title="Copy public schedule link"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Share2 className="w-3.5 h-3.5" /> Share</>
              )}
            </Button>
            {/* Layout toggle */}
            <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setLayoutView("table")}
                className={`px-2 py-1.5 flex items-center transition-colors ${
                  layoutView === "table" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
                title="Transposed table"
              >
                <Table2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayoutView("cards")}
                className={`px-2 py-1.5 flex items-center transition-colors ${
                  layoutView === "cards" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
                title="Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <CalendarDays className="w-10 h-10 animate-pulse" />
              <span className="text-sm">Loading schedule…</span>
            </div>
          </div>
        ) : sundaysInWindow.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <Table2 className="w-10 h-10" />
              <span className="text-sm">No Sundays in this period.</span>
            </div>
          </div>
        ) : layoutView === "cards" ? (
            /* ── Cards view (all screen sizes) ── */
            <div className="space-y-3">
              {sundaysInWindow.map((dateStr) => {
                const isToday = dateStr === today;
                const isNearest = !isToday && dateStr === nearest;
                const dayData = assignmentMap[dateStr];
                const rolesToShow = allRoles.filter((role) => {
                  const personStr = dayData?.[role];
                  return personStr && personStr.trim().length > 0;
                });
                return (
                  <div
                    key={dateStr}
                    ref={isToday || isNearest ? nearestRef : null}
                    className={`rounded-xl border shadow-sm [overflow:clip] ${
                      isToday
                        ? "border-blue-300 bg-blue-50"
                        : isNearest
                        ? "border-indigo-200 bg-indigo-50/40"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div
                      className={`sticky top-0 z-10 px-4 py-2.5 flex items-center gap-2 border-b ${
                        isToday
                          ? "bg-blue-100 border-blue-200"
                          : isNearest
                          ? "bg-indigo-100/50 border-indigo-200"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <CalendarDays className={`w-4 h-4 shrink-0 ${isToday ? "text-blue-600" : isNearest ? "text-indigo-500" : "text-gray-400"}`} />
                      <span className={`font-bold text-sm ${isToday ? "text-blue-800" : isNearest ? "text-indigo-700" : "text-gray-800"}`}>
                        {formatSundayRow(dateStr)}
                      </span>
                      {isToday && (
                        <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-100 border border-blue-300 rounded-full px-2 py-0.5">
                          Today
                        </span>
                      )}
                      {isNearest && (
                        <span className="ml-auto text-[10px] font-semibold text-indigo-600 bg-indigo-100 border border-indigo-300 rounded-full px-2 py-0.5">
                          Next
                        </span>
                      )}
                    </div>
                    {rolesToShow.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400 italic">No assignments yet</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {rolesToShow.map((role) => {
                          const personStr = dayData?.[role] ?? "";
                          const people = personStr.split(",").map((p) => p.trim()).filter(Boolean);
                          return (
                            <div key={role} className="px-4 py-2.5 flex gap-3">
                              <span className="text-xs font-semibold text-gray-500 w-36 shrink-0 pt-0.5 leading-tight">
                                {role}
                              </span>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                {people.map((name, i) => (
                                  <div key={i}>
                                    <span className="text-sm font-medium text-gray-800">{name}</span>
                                    {emailMap[name.toLowerCase()] && (
                                      <a
                                        href={`mailto:${emailMap[name.toLowerCase()]}`}
                                        className="block text-[11px] text-blue-500 hover:underline truncate"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {emailMap[name.toLowerCase()]}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Transposed table: roles as rows, Sundays as columns ── */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-auto max-h-[calc(100vh-260px)]">
              <table className="border-collapse min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 min-w-[180px]">
                      Role
                    </th>
                    {sundaysInWindow.map((dateStr) => {
                      const isToday = dateStr === today;
                      const isNearest = !isToday && dateStr === nearest;
                      return (
                        <th
                          key={dateStr}
                          ref={isToday || isNearest ? nearestRef : null}
                          className={`border-b border-r border-gray-200 px-4 py-3 text-center text-xs font-semibold min-w-[130px] whitespace-nowrap ${
                            isToday
                              ? "bg-blue-100 text-blue-700"
                              : isNearest
                              ? "bg-indigo-50 text-indigo-600"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          <div>{formatSundayRow(dateStr)}</div>
                          {isToday && <div className="text-[10px] font-medium text-blue-500 mt-0.5">Today</div>}
                          {isNearest && <div className="text-[10px] font-medium text-indigo-400 mt-0.5">Next</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {allRoles.map((role, rowIdx) => (
                    <tr key={role} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                      <td
                        className={`sticky left-0 z-10 border-r border-b border-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 ${
                          rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        {role}
                      </td>
                      {sundaysInWindow.map((dateStr) => {
                        const isToday = dateStr === today;
                        const isNearest = !isToday && dateStr === nearest;
                        const personStr = assignmentMap[dateStr]?.[role];
                        const people = personStr
                          ? personStr.split(",").map((p) => p.trim()).filter(Boolean)
                          : [];
                        return (
                          <td
                            key={dateStr}
                            className={`border-r border-b border-gray-100 px-3 py-2 text-center ${
                              isToday ? "bg-blue-50/50" : isNearest ? "bg-indigo-50/20" : ""
                            }`}
                          >
                            {people.length > 0 ? (
                              <div className="flex flex-col items-center gap-1">
                                {people.map((name, i) => (
                                  <div key={i} className="flex flex-col items-center gap-0.5">
                                    <span className="text-gray-800 font-medium text-sm">{name}</span>
                                    {emailMap[name.toLowerCase()] && (
                                      <a
                                        href={`mailto:${emailMap[name.toLowerCase()]}`}
                                        className="text-[11px] text-blue-500 hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {emailMap[name.toLowerCase()]}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300 select-none">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}

        {/* ── Legend ── */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-50 border border-blue-200" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-indigo-50/40 border border-indigo-200" />
            <span>Next Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-semibold text-base leading-none">—</span>
            <span>Not assigned</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
