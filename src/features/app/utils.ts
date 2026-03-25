import type { Language } from "./types";

export const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentTime() {
  const now = new Date();
  const hours = `${now.getHours()}`.padStart(2, "0");
  const minutes = `${now.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function parseDateAndTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) return null;

  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    [year, month, day, hours, minutes].some((value) => Number.isNaN(value))
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function formatDateWithWeekday(value: string, language: Language) {
  if (!value) return "-";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  const locale = language === "es" ? "es-US" : "en-US";
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${value}`;
}

export function formatTimestamp(value: string, language: Language) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(language === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeEmployeeCode(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

export function getOpenShiftMinutes(dateValue: string, clockIn: string, now = new Date()) {
  const start = parseDateAndTime(dateValue, clockIn);
  if (!start) return null;

  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return null;

  return Math.round(diffMs / 60000);
}

export function formatMinutesAsHours(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function formatDuration(clockIn: string, clockOut: string | null, language: Language) {
  if (!clockOut) return language === "es" ? "Turno abierto" : "Open shift";

  const start = parseTime(clockIn);
  const end = parseTime(clockOut);

  if (!start || !end || end < start) return language === "es" ? "Sin calcular" : "Not calculated";

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
