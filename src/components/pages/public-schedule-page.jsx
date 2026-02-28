// src/components/pages/public-schedule-page.jsx
// Publicly accessible — no login required
import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RotateCcw,
  Table2,
} from "lucide-react";
import { Button } from "../ui/button";
import env from "../../config/env";

// ─── Helpers (mirrored from schedule-page) ──────────────────────────────────

const DEFAULT_ROLE_ORDER = [
  "Voorganger",
  "Ouderling van dienst",
  "Muzikale begeleiding",
  "Voorzangers",
  "Lector",
  "Beamer",
  "Sound",
  "Guest Reception Team",
  "Coffee Service",
  "Sunday School Teacher",
];

function todayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function todayString() {
  return todayUTC().toISOString().slice(0, 10);
}

function nearestSundayString() {
  const d = todayUTC();
  const diff = (7 - d.getUTCDay()) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSundaysInRange(start, end) {
  const sundays = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor.getUTCDay() !== 0) cursor.setUTCDate(cursor.getUTCDate() + 1);
  while (cursor <= end) {
    sundays.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return sundays;
}

function formatSundayRow(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function getWindow(mode, cursor) {
  const y = cursor.getUTCFullYear();
  const m = cursor.getUTCMonth();

  if (mode === "monthly") {
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    return {
      start, end,
      label: cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
    };
  }
  if (mode === "quarterly") {
    const q = Math.floor(m / 3);
    const start = new Date(Date.UTC(y, q * 3, 1));
    const end = new Date(Date.UTC(y, q * 3 + 3, 0));
    return { start, end, label: `Q${q + 1} ${y}` };
  }
  // annual
  return {
    start: new Date(Date.UTC(y, 0, 1)),
    end: new Date(Date.UTC(y, 11, 31)),
    label: String(y),
  };
}

function advanceCursor(cursor, mode, direction) {
  const d = new Date(cursor);
  if (mode === "monthly") d.setUTCMonth(d.getUTCMonth() + direction);
  else if (mode === "quarterly") d.setUTCMonth(d.getUTCMonth() + direction * 3);
  else d.setUTCFullYear(d.getUTCFullYear() + direction);
  return d;
}

const VIEW_MODES = [
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function PublicSchedulePage() {
  const [mode, setMode] = useState("monthly");
  const [cursor, setCursor] = useState(() => todayUTC());
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch public schedule data (no auth header needed)
  useEffect(() => {
    setLoading(true);
    fetch(`${env.API_URL}/public/schedule`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load schedule");
        return res.json();
      })
      .then((data) => {
        setRawData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load the schedule. Please try again later.");
        setLoading(false);
      });
  }, []);

  const { start, end, label } = useMemo(() => getWindow(mode, cursor), [mode, cursor]);
  const sundaysInWindow = useMemo(() => getSundaysInRange(start, end), [start, end]);

  // Build lookup: dateString → { role → person }
  const assignmentMap = useMemo(() => {
    const map = {};
    for (const service of rawData) {
      const roleMap = {};
      for (const { role, person } of service.assignments ?? []) {
        if (!roleMap[role]) roleMap[role] = [];
        if (person) roleMap[role].push(person);
      }
      map[service.dateString] = Object.fromEntries(
        Object.entries(roleMap).map(([r, p]) => [r, p.join(", ")])
      );
    }
    return map;
  }, [rawData]);

  // Collect all roles — default order first, then any extras observed in data
  const allRoles = useMemo(() => {
    const extra = new Set();
    for (const service of rawData) {
      for (const { role } of service.assignments ?? []) {
        if (!DEFAULT_ROLE_ORDER.includes(role)) extra.add(role);
      }
    }
    return [...DEFAULT_ROLE_ORDER, ...extra];
  }, [rawData]);

  const today = todayString();
  const nearest = nearestSundayString();

  const handlePrev = () => setCursor((c) => advanceCursor(c, mode, -1));
  const handleNext = () => setCursor((c) => advanceCursor(c, mode, +1));
  const handleToday = () => setCursor(todayUTC());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Public header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800 text-lg">GKIN Service Schedule</span>
          </div>
          <span className="text-xs text-gray-400">Public view · read-only</span>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        {/* ── Controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            {VIEW_MODES.map(({ key, label: modeLabel }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  mode === key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"
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

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <CalendarDays className="w-10 h-10 animate-pulse" />
              <span className="text-sm">Loading schedule…</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400">
            <span className="text-sm">{error}</span>
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
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 min-w-[100px]">
                    Date
                  </th>
                  {allRoles.map((role) => (
                    <th
                      key={role}
                      className="bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[140px]"
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sundaysInWindow.map((dateStr, rowIdx) => {
                  const isToday = dateStr === today;
                  const isNearest = !isToday && dateStr === nearest;

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
                      {/* Date cell */}
                      <td className={`sticky left-0 z-10 border-r border-b border-gray-100 px-4 py-2.5 ${stickyBg}`}>
                        <div
                          className={`font-semibold text-sm leading-tight ${
                            isToday ? "text-blue-700" : isNearest ? "text-indigo-600" : "text-gray-800"
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
                      </td>

                      {/* Role cells */}
                      {allRoles.map((role) => {
                        const people = (assignmentMap[dateStr]?.[role] ?? "")
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        return (
                          <td
                            key={role}
                            className="border-r border-b border-gray-100 px-4 py-2.5 text-center"
                          >
                            {people.length > 0 ? (
                              <span className="text-gray-800 font-medium">
                                {people.join(", ")}
                              </span>
                            ) : (
                              <span className="text-gray-300 select-none">—</span>
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
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400">
        GKIN Rooster · Schedule is updated by the admin team
      </footer>
    </div>
  );
}
