import type { AttendanceEntry, Language, PayrollEmployeeSummary, StoreName, UserEntry } from "./types";

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

export function getUniqueLocations(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    )
  );
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

export function roundHours(totalMinutes: number) {
  return Math.round((Math.max(0, totalMinutes) / 60) * 100) / 100;
}

export function getWorkedMinutes(entry: AttendanceEntry) {
  if (!entry.clockOut) return null;

  const start = parseDateAndTime(entry.date, entry.clockIn);
  const end = parseDateAndTime(entry.date, entry.clockOut);

  if (!start || !end || end < start) return null;

  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function getWeekKey(dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function buildPayrollSummary(params: {
  attendance: AttendanceEntry[];
  payrollPeriodStart: string | null;
  store: StoreName;
  users: UserEntry[];
}) {
  const { attendance, payrollPeriodStart, store, users } = params;
  const periodStart = payrollPeriodStart ? new Date(payrollPeriodStart) : null;

  const filteredEntries = attendance.filter((entry) => {
    if (entry.store !== store) return false;
    const entryStart = parseDateAndTime(entry.date, entry.clockIn);
    if (!entryStart) return false;
    if (periodStart && entryStart < periodStart) return false;
    return true;
  });

  const userMap = new Map(users.map((user) => [normalizeEmployeeCode(user.employeeCode), user]));
  const weeklyMap = new Map<
    string,
    {
      workedMinutes: number;
      dailyMinutes: Map<string, number>;
      openShiftCount: number;
      alertCount: number;
    }
  >();

  filteredEntries.forEach((entry) => {
    const employeeCode = normalizeEmployeeCode(entry.employeeCode);
    const weekKey = getWeekKey(entry.date);
    const bucketKey = `${employeeCode}__${weekKey}`;
    const current = weeklyMap.get(bucketKey) ?? {
      workedMinutes: 0,
      dailyMinutes: new Map<string, number>(),
      openShiftCount: 0,
      alertCount: 0,
    };

    const workedMinutes = getWorkedMinutes(entry);
    const openMinutes = getOpenShiftMinutes(entry.date, entry.clockIn);
    const alertCount =
      !entry.clockOut && openMinutes !== null && openMinutes >= 12 * 60 ? 1 : 0;

    weeklyMap.set(bucketKey, {
      workedMinutes: current.workedMinutes + (workedMinutes ?? 0),
      dailyMinutes: new Map(current.dailyMinutes).set(
        entry.date,
        (current.dailyMinutes.get(entry.date) ?? 0) + (workedMinutes ?? 0)
      ),
      openShiftCount: current.openShiftCount + (entry.clockOut ? 0 : 1),
      alertCount: current.alertCount + alertCount,
    });
  });

  const totals = new Map<
    string,
    {
      regularMinutes: number;
      overtimeMinutes: number;
      openShiftCount: number;
      alertCount: number;
    }
  >();

  weeklyMap.forEach((bucket, bucketKey) => {
    const [employeeCode] = bucketKey.split("__");
    const current = totals.get(employeeCode) ?? {
      regularMinutes: 0,
      overtimeMinutes: 0,
      openShiftCount: 0,
      alertCount: 0,
    };
    const cappedDailyRegularMinutes = Array.from(bucket.dailyMinutes.values()).reduce(
      (sum, dayMinutes) => sum + Math.min(dayMinutes, 8 * 60),
      0
    );
    const regularMinutes = Math.min(cappedDailyRegularMinutes, 40 * 60);
    const overtimeMinutes = Math.max(bucket.workedMinutes - regularMinutes, 0);

    totals.set(employeeCode, {
      regularMinutes: current.regularMinutes + regularMinutes,
      overtimeMinutes: current.overtimeMinutes + overtimeMinutes,
      openShiftCount: current.openShiftCount + bucket.openShiftCount,
      alertCount: current.alertCount + bucket.alertCount,
    });
  });

  const summaries: PayrollEmployeeSummary[] = Array.from(totals.entries())
    .map(([employeeCode, total]) => {
      const user = userMap.get(employeeCode);
      return {
        userId: user?.id ?? employeeCode,
        employeeCode,
        employeeName: user?.fullName ?? employeeCode,
        jobTitle: user?.jobTitle ?? "",
        store,
        regularHours: roundHours(total.regularMinutes),
        overtimeHours: roundHours(total.overtimeMinutes),
        totalHours: roundHours(total.regularMinutes + total.overtimeMinutes),
        openShiftCount: total.openShiftCount,
        alertCount: total.alertCount,
      };
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  return summaries;
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
