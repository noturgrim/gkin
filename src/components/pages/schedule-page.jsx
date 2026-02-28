import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Table2,
  RotateCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Header } from "../layout/header";
import { Footer } from "../ui/footer";
import { useAssignments } from "../assignments/context/AssignmentsContext";
import authService from "../../services/authService";

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

      <main className="flex-1 max-w-full px-4 py-6 mx-auto w-full">
        {/* ── Controls bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* Back to dashboard */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-gray-600"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Button>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            {VIEW_MODES.map(({ key, label: modeLabel }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  mode === key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {modeLabel}
              </button>
            ))}
          </div>

          {/* Period navigator */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-gray-800 min-w-[140px] text-center">
              {label}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 text-gray-600 h-8"
              onClick={handleToday}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Today
            </Button>
          </div>
        </div>

        {/* ── Grid ── */}
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
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-auto">
            <table className="border-collapse min-w-full text-sm">
              {/* ── Header row: role names as columns ── */}
              <thead>
                <tr>
                  {/* Top-left corner */}
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 min-w-[100px]">
                    Date
                  </th>
                  {allRoles.length === 0 ? (
                    <th className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold text-gray-400">
                      No roles configured
                    </th>
                  ) : (
                    allRoles.map((role) => (
                      <th
                        key={role}
                        className="bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[140px]"
                      >
                        {role}
                      </th>
                    ))
                  )}
                </tr>
              </thead>

              {/* ── Body rows: one row per Sunday ── */}
              <tbody>
                {sundaysInWindow.map((dateStr, rowIdx) => {
                  const isToday = dateStr === today;
                  const isNearest = !isToday && dateStr === nearest;
                  const hasData = !!assignmentMap[dateStr];

                  const rowBg = isToday
                    ? "bg-blue-50"
                    : isNearest
                    ? "bg-indigo-50/40"
                    : rowIdx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50/60";

                  const stickyBg = isToday
                    ? "bg-blue-50"
                    : isNearest
                    ? "bg-indigo-50/40"
                    : rowIdx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50";

                  return (
                    <tr key={dateStr} className={rowBg}>
                      {/* Sticky date cell */}
                      <td
                        className={`sticky left-0 z-10 border-r border-b border-gray-100 px-4 py-2.5 ${stickyBg}`}
                      >
                        <div
                          className={`font-semibold text-sm leading-tight ${
                            isToday
                              ? "text-blue-700"
                              : isNearest
                              ? "text-indigo-600"
                              : "text-gray-800"
                          }`}
                        >
                          {formatSundayRow(dateStr)}
                        </div>
                        {isToday && (
                          <div className="text-[10px] text-blue-500 font-medium mt-0.5">Today</div>
                        )}
                        {isNearest && (
                          <div className="text-[10px] text-indigo-400 font-medium mt-0.5">Next</div>
                        )}
                        {!hasData && (
                          <div className="text-[10px] text-gray-400 mt-0.5">No data</div>
                        )}
                      </td>

                      {/* Role cells */}
                      {allRoles.map((role) => {
                        const person = assignmentMap[dateStr]?.[role];
                        return (
                          <td
                            key={role}
                            className="border-r border-b border-gray-100 px-4 py-2.5 text-center"
                          >
                            {hasData ? (
                              person ? (
                                <span className="text-gray-800 font-medium">{person}</span>
                              ) : (
                                <span className="text-gray-300 select-none">—</span>
                              )
                            ) : (
                              <span className="text-gray-200 select-none text-xs">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-indigo-50/40 border border-indigo-200" />
            <span>Next Sunday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-semibold text-base leading-none">—</span>
            <span>Not yet assigned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-200 font-semibold text-base leading-none">·</span>
            <span>No service data</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
