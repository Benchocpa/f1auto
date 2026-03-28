import type {
  AttendanceEntry,
  Language,
  PayrollEmployeeSummary,
  SalesPeriodPreset,
  StoreName,
  UserEntry,
  UserWorkSummary,
} from "./types";

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

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateString(date);
}

export function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

export function getWeekDates(range = getCurrentWeekRange()) {
  const start = new Date(`${range.start}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateString(date);
  });
}

export function getCurrentMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

export function getCurrentYearRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const end = new Date(today.getFullYear(), 11, 31);
  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

export function getSalesPeriodRange(
  preset: SalesPeriodPreset,
  customStart: string,
  customEnd: string
) {
  switch (preset) {
    case "today": {
      const date = getTodayDate();
      return { start: date, end: date };
    }
    case "yesterday": {
      const date = getYesterdayDate();
      return { start: date, end: date };
    }
    case "week":
      return getCurrentWeekRange();
    case "month":
      return getCurrentMonthRange();
    case "year":
      return getCurrentYearRange();
    case "custom":
      return {
        start: customStart || getTodayDate(),
        end: customEnd || customStart || getTodayDate(),
      };
  }
}

export function isDateWithinRange(value: string, start: string, end: string) {
  if (!value || !start || !end) return false;
  return value >= start && value <= end;
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

export function buildUserWorkSummaries(params: {
  attendance: AttendanceEntry[];
  users: UserEntry[];
  now?: Date;
}) {
  const { attendance, users, now = new Date() } = params;
  const today = getTodayDate();
  const currentWeek = getCurrentWeekRange();
  const weekDates = getWeekDates(currentWeek);
  const summaryMap = new Map<string, UserWorkSummary>();
  const minutesMap = new Map<string, { today: number; week: number }>();
  const weeklyDailyMap = new Map<string, Map<string, number>>();
  const weeklyTimeMap = new Map<
    string,
    Map<string, { firstClockIn: string | null; lastClockOut: string | null }>
  >();

  users.forEach((user) => {
    const employeeCode = normalizeEmployeeCode(user.employeeCode);
    summaryMap.set(employeeCode, {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      employeeCode: user.employeeCode,
      jobTitle: user.jobTitle,
      role: user.role,
      store: user.store,
      isBlocked: user.isBlocked,
      workedTodayHours: 0,
      workedWeekHours: 0,
      openShiftCount: 0,
      currentShiftMinutes: 0,
      openShiftStore: null,
      lastActivityAt: null,
      lastStore: user.store,
      weekDailyHours: weekDates.map((date) => ({
        date,
        hours: 0,
        clockIn: null,
        clockOut: null,
      })),
    });
    minutesMap.set(employeeCode, { today: 0, week: 0 });
    weeklyDailyMap.set(
      employeeCode,
      new Map(weekDates.map((date) => [date, 0]))
    );
    weeklyTimeMap.set(
      employeeCode,
      new Map(
        weekDates.map((date) => [
          date,
          { firstClockIn: null, lastClockOut: null },
        ])
      )
    );
  });

  attendance.forEach((entry) => {
    const employeeCode = normalizeEmployeeCode(entry.employeeCode);
    const summary = summaryMap.get(employeeCode);
    const minuteBucket = minutesMap.get(employeeCode);
    const dailyBucket = weeklyDailyMap.get(employeeCode);
    const dailyTimeBucket = weeklyTimeMap.get(employeeCode);
    if (!summary || !minuteBucket || !dailyBucket || !dailyTimeBucket) return;

    const workedMinutes = entry.clockOut
      ? getWorkedMinutes(entry) ?? 0
      : getOpenShiftMinutes(entry.date, entry.clockIn, now) ?? 0;

    if (entry.date === today) {
      minuteBucket.today += workedMinutes;
    }

    if (isDateWithinRange(entry.date, currentWeek.start, currentWeek.end)) {
      minuteBucket.week += workedMinutes;
      dailyBucket.set(entry.date, (dailyBucket.get(entry.date) ?? 0) + workedMinutes);
      const currentTimes = dailyTimeBucket.get(entry.date) ?? {
        firstClockIn: null,
        lastClockOut: null,
      };
      dailyTimeBucket.set(entry.date, {
        firstClockIn:
          currentTimes.firstClockIn && currentTimes.firstClockIn <= entry.clockIn
            ? currentTimes.firstClockIn
            : entry.clockIn,
        lastClockOut:
          entry.clockOut && (!currentTimes.lastClockOut || entry.clockOut >= currentTimes.lastClockOut)
            ? entry.clockOut
            : currentTimes.lastClockOut,
      });
    }

    if (!entry.clockOut) {
      summary.openShiftCount += 1;
      summary.currentShiftMinutes = Math.max(summary.currentShiftMinutes, workedMinutes);
      summary.openShiftStore = entry.store;
    }

    const activityDate = parseDateAndTime(entry.date, entry.clockOut ?? entry.clockIn);
    if (activityDate) {
      const activityIso = activityDate.toISOString();
      if (!summary.lastActivityAt || activityIso > summary.lastActivityAt) {
        summary.lastActivityAt = activityIso;
        summary.lastStore = entry.store;
      }
    }
  });

  return Array.from(summaryMap.entries())
    .map(([employeeCode, summary]) => {
      const minuteBucket = minutesMap.get(employeeCode) ?? { today: 0, week: 0 };
      const dailyBucket = weeklyDailyMap.get(employeeCode) ?? new Map<string, number>();
      const dailyTimeBucket = weeklyTimeMap.get(employeeCode) ?? new Map<string, { firstClockIn: string | null; lastClockOut: string | null }>();
      return {
        ...summary,
        workedTodayHours: roundHours(minuteBucket.today),
        workedWeekHours: roundHours(minuteBucket.week),
        weekDailyHours: weekDates.map((date) => ({
          date,
          hours: roundHours(dailyBucket.get(date) ?? 0),
          clockIn: dailyTimeBucket.get(date)?.firstClockIn ?? null,
          clockOut: dailyTimeBucket.get(date)?.lastClockOut ?? null,
        })),
      };
    })
    .sort((a, b) => {
    if (a.openShiftCount !== b.openShiftCount) {
      return b.openShiftCount - a.openShiftCount;
    }
    return a.fullName.localeCompare(b.fullName);
    });
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
