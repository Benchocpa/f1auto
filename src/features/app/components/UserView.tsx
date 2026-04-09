import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Lock, Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import type { AttendanceEntry, Language, PayrollEmployeeSummary, SalesPeriodPreset, StoreName, Translate, UserEntry, UserRole, UserWorkSummary } from "../types";
import { buildUserWorkSummaries, formatMinutesAsHours, formatTimestamp, getSalesPeriodRange, getWeekRangeFromOffset, getWorkedMinutes, isDateWithinRange, normalizeEmployeeCode, roundHours } from "../utils";
import { Field, MiniStat, StatCard } from "./common";

interface UserViewProps {
  attendance: AttendanceEntry[];
  availableLocations: string[];
  currentUserId: string;
  language: Language;
  onCreateUser: () => void;
  onEditUser: (user: UserEntry) => void;
  onSaveAttendanceCorrection: (payload: {
    user: UserEntry;
    date: string;
    clockIn: string;
    clockOut: string;
    store: StoreName;
    notes: string;
  }) => boolean;
  onRequestBlockToggle: (user: UserEntry) => void;
  onRequestDelete: (user: UserEntry) => void;
  t: Translate;
  userPayrollData: Map<
    string,
    {
      summary: PayrollEmployeeSummary | null;
      periodLabel: string;
      store: StoreName;
    }
  >;
  userSummaries: UserWorkSummary[];
  users: UserEntry[];
}

export function UserView({
  attendance,
  availableLocations,
  currentUserId,
  language,
  onCreateUser,
  onEditUser,
  onSaveAttendanceCorrection,
  onRequestBlockToggle,
  onRequestDelete,
  t,
  userPayrollData,
  userSummaries,
  users,
}: UserViewProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [payrollUserId, setPayrollUserId] = useState<string | null>(null);
  const [payrollPeriod, setPayrollPeriod] = useState<SalesPeriodPreset>("week");
  const [payrollCustomStart, setPayrollCustomStart] = useState("");
  const [payrollCustomEnd, setPayrollCustomEnd] = useState("");
  const [attendanceCorrectionTarget, setAttendanceCorrectionTarget] = useState<{
    user: UserEntry;
    date: string;
  } | null>(null);
  const [attendanceCorrectionForm, setAttendanceCorrectionForm] = useState<{
    clockIn: string;
    clockOut: string;
    store: StoreName;
    notes: string;
  }>({
    clockIn: "",
    clockOut: "",
    store: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked" | "open">("all");
  const [storeFilter, setStoreFilter] = useState<"all" | StoreName>("all");
  const [weekOffset, setWeekOffset] = useState(0);

  const selectedWeekRange = useMemo(() => getWeekRangeFromOffset(weekOffset), [weekOffset]);
  const displayedUserSummaries = useMemo(
    () =>
      buildUserWorkSummaries({
        attendance,
        users,
        weekRange: selectedWeekRange,
      }),
    [attendance, selectedWeekRange, users]
  );

  const totalUsers = displayedUserSummaries.length;
  const totalActiveUsers = displayedUserSummaries.filter((entry) => !entry.isBlocked).length;
  const totalBlockedUsers = displayedUserSummaries.filter((entry) => entry.isBlocked).length;
  const totalOpenShifts = displayedUserSummaries.reduce((sum, entry) => sum + entry.openShiftCount, 0);
  const totalHoursToday = displayedUserSummaries.reduce((sum, entry) => sum + entry.workedTodayHours, 0);
  const totalHoursWeek = displayedUserSummaries.reduce((sum, entry) => sum + entry.workedWeekHours, 0);

  const filteredSummaries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return displayedUserSummaries.filter((entry) => {
      if (
        normalizedSearch &&
        ![
          entry.fullName,
          entry.email,
          entry.employeeCode,
          entry.jobTitle,
          entry.lastStore,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (roleFilter !== "all" && entry.role !== roleFilter) return false;

      if (storeFilter !== "all" && entry.lastStore !== storeFilter && entry.store !== storeFilter) {
        return false;
      }

      if (statusFilter === "active" && entry.isBlocked) return false;
      if (statusFilter === "blocked" && !entry.isBlocked) return false;
      if (statusFilter === "open" && entry.openShiftCount === 0) return false;

      return true;
    });
  }, [displayedUserSummaries, roleFilter, search, statusFilter, storeFilter]);

  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
        weekday: "short",
      }),
    [language]
  );

  const selectedPayrollUser = payrollUserId
    ? users.find((entry) => entry.id === payrollUserId) ?? null
    : null;
  const selectedPayrollData = payrollUserId ? userPayrollData.get(payrollUserId) ?? null : null;
  const payrollRange = useMemo(
    () => getSalesPeriodRange(payrollPeriod, payrollCustomStart, payrollCustomEnd),
    [payrollCustomEnd, payrollCustomStart, payrollPeriod]
  );
  const selectedPayrollSummary = useMemo(() => {
    if (!selectedPayrollUser) return null;

    const weeklyBuckets = new Map<
      string,
      {
        workedMinutes: number;
        dailyMinutes: Map<string, number>;
      }
    >();
    const storesInPeriod = new Set<StoreName>();
    let openShiftCount = 0;

    const getWeekKey = (dateValue: string) => {
      const date = new Date(`${dateValue}T12:00:00`);
      if (Number.isNaN(date.getTime())) return dateValue;
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNumber = utcDate.getUTCDay() || 7;
      utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
      const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
      const weekNumber = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
    };

    attendance.forEach((entry) => {
      if (normalizeEmployeeCode(entry.employeeCode) !== normalizeEmployeeCode(selectedPayrollUser.employeeCode)) return;
      if (!isDateWithinRange(entry.date, payrollRange.start, payrollRange.end)) return;

      storesInPeriod.add(entry.store);
      const weekKey = getWeekKey(entry.date);
      const current = weeklyBuckets.get(weekKey) ?? {
        workedMinutes: 0,
        dailyMinutes: new Map<string, number>(),
      };
      const workedMinutes = getWorkedMinutes(entry) ?? 0;

      weeklyBuckets.set(weekKey, {
        workedMinutes: current.workedMinutes + workedMinutes,
        dailyMinutes: new Map(current.dailyMinutes).set(
          entry.date,
          (current.dailyMinutes.get(entry.date) ?? 0) + workedMinutes
        ),
      });

      if (!entry.clockOut) {
        openShiftCount += 1;
      }
    });

    let regularMinutes = 0;
    let overtimeMinutes = 0;

    weeklyBuckets.forEach((bucket) => {
      const cappedDailyRegularMinutes = Array.from(bucket.dailyMinutes.values()).reduce(
        (sum, dayMinutes) => sum + Math.min(dayMinutes, 8 * 60),
        0
      );
      const weekRegularMinutes = Math.min(cappedDailyRegularMinutes, 40 * 60);
      regularMinutes += weekRegularMinutes;
      overtimeMinutes += Math.max(bucket.workedMinutes - weekRegularMinutes, 0);
    });

    return {
      regularHours: roundHours(regularMinutes),
      overtimeHours: roundHours(overtimeMinutes),
      totalHours: roundHours(regularMinutes + overtimeMinutes),
      openShiftCount,
      stores: Array.from(storesInPeriod).sort((a, b) => a.localeCompare(b)),
    };
  }, [attendance, payrollRange.end, payrollRange.start, selectedPayrollUser]);
  const selectedPayrollEntries = useMemo(() => {
    if (!selectedPayrollUser) return [];

    return attendance
      .filter((entry) => {
        if (normalizeEmployeeCode(entry.employeeCode) !== normalizeEmployeeCode(selectedPayrollUser.employeeCode)) {
          return false;
        }

        return isDateWithinRange(entry.date, payrollRange.start, payrollRange.end);
      })
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.clockIn.localeCompare(b.clockIn);
        }
        return a.date.localeCompare(b.date);
      });
  }, [attendance, payrollRange.end, payrollRange.start, selectedPayrollUser]);
  const attendanceByUserAndDate = useMemo(() => {
    const map = new Map<string, AttendanceEntry>();
    attendance.forEach((entry) => {
      const key = `${entry.employeeCode}::${entry.date}`;
      const current = map.get(key);
      if (!current) {
        map.set(key, entry);
        return;
      }
      if (entry.clockIn < current.clockIn) {
        map.set(key, entry);
      }
    });
    return map;
  }, [attendance]);

  const handleDownloadPayrollCsv = () => {
    if (!selectedPayrollUser || !selectedPayrollSummary) return;

    const summaryRows = [
      ["Employee", selectedPayrollUser.fullName],
      ["Employee Code", selectedPayrollUser.employeeCode],
      ["Job Title", selectedPayrollUser.jobTitle],
      ["Period Start", payrollRange.start],
      ["Period End", payrollRange.end],
      ["Regular Hours", selectedPayrollSummary.regularHours.toFixed(2)],
      ["Overtime Hours", selectedPayrollSummary.overtimeHours.toFixed(2)],
      ["Total Hours", selectedPayrollSummary.totalHours.toFixed(2)],
      ["Open Shifts", String(selectedPayrollSummary.openShiftCount)],
      ["Stores", selectedPayrollSummary.stores.join(", ") || "-"],
    ];

    const detailRows = selectedPayrollEntries.map((entry) => [
      entry.date,
      entry.store,
      entry.clockIn,
      entry.clockOut ?? "",
      roundHours(getWorkedMinutes(entry) ?? 0).toFixed(2),
      entry.notes,
    ]);

    const csv = [
      ["Payroll liquidation"],
      [],
      ["Field", "Value"],
      ...summaryRows,
      [],
      ["Date", "Store", "Clock-in", "Clock-out", "Worked Hours", "Notes"],
      ...detailRows,
    ]
      .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `liquidation-${selectedPayrollUser.fullName.replace(/\s+/g, "-").toLowerCase()}-${payrollRange.start}-${payrollRange.end}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPayrollPdf = () => {
    if (!selectedPayrollUser || !selectedPayrollSummary) return;

    const payrollWindow = window.open("", "_blank", "width=980,height=720");
    if (!payrollWindow) return;

    const detailRows = selectedPayrollEntries
      .map((entry) => {
        const workedHours = roundHours(getWorkedMinutes(entry) ?? 0).toFixed(2);
        return `
          <tr>
            <td>${entry.date}</td>
            <td>${entry.store}</td>
            <td>${entry.clockIn}</td>
            <td>${entry.clockOut ?? "-"}</td>
            <td>${workedHours}</td>
            <td>${entry.notes || "-"}</td>
          </tr>
        `;
      })
      .join("");

    payrollWindow.document.write(`
      <html>
        <head>
          <title>Payroll liquidation</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px; }
            p { margin: 4px 0; color: #4b5563; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; margin: 20px 0; }
            .card { border: 1px solid #d4d4d8; border-radius: 12px; padding: 14px; margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #d4d4d8; padding: 8px 10px; text-align: left; vertical-align: top; font-size: 12px; }
            th { background: #f5f5f5; }
            .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 18px 0; }
            .summary-item { border: 1px solid #d4d4d8; border-radius: 12px; padding: 12px; }
            .summary-item strong { display: block; font-size: 20px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>Payroll liquidation</h1>
          <p>Employee: ${selectedPayrollUser.fullName}</p>
          <p>Code: ${selectedPayrollUser.employeeCode}</p>
          <p>Job title: ${selectedPayrollUser.jobTitle}</p>
          <p>Range: ${payrollRange.start} → ${payrollRange.end}</p>

          <div class="summary">
            <div class="summary-item">Regular hours<strong>${selectedPayrollSummary.regularHours.toFixed(2)}</strong></div>
            <div class="summary-item">Overtime<strong>${selectedPayrollSummary.overtimeHours.toFixed(2)}</strong></div>
            <div class="summary-item">Total hours<strong>${selectedPayrollSummary.totalHours.toFixed(2)}</strong></div>
            <div class="summary-item">Open shifts<strong>${selectedPayrollSummary.openShiftCount}</strong></div>
          </div>

          <div class="card">
            <p><strong>Stores included:</strong> ${selectedPayrollSummary.stores.join(", ") || "-"}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Store</th>
                <th>Clock-in</th>
                <th>Clock-out</th>
                <th>Worked hours</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${detailRows || `<tr><td colspan="6">No attendance entries for this period.</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>
    `);
    payrollWindow.document.close();
    payrollWindow.focus();
    payrollWindow.print();
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("Total users", "Usuarios totales")}
          value={String(totalUsers)}
          detail={t("Registered accounts", "Cuentas registradas")}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("Active users", "Usuarios activos")}
          value={String(totalActiveUsers)}
          detail={t("Enabled to work", "Habilitados para operar")}
        />
        <StatCard
          icon={<Lock className="h-5 w-5" />}
          label={t("Blocked users", "Usuarios bloqueados")}
          value={String(totalBlockedUsers)}
          detail={t("Restricted accounts", "Cuentas restringidas")}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label={t("Open shifts", "Turnos abiertos")}
          value={String(totalOpenShifts)}
          detail={t("Users currently clocked in", "Usuarios actualmente activos")}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label={t("Hours today", "Horas de hoy")}
          value={totalHoursToday.toFixed(2)}
          detail={t("Worked across all users", "Trabajadas entre todos los usuarios")}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label={t("Hours this week", "Horas de la semana")}
          value={totalHoursWeek.toFixed(2)}
          detail={`${selectedWeekRange.start} → ${selectedWeekRange.end}`}
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Users", "Usuarios")}</p>
            <h2 className="panel-title">{t("User control center", "Centro de control de usuarios")}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{filteredSummaries.length} {t("results", "resultados")}</Badge>
            <Button type="button" onClick={onCreateUser}>
              {t("Create user", "Crear usuario")}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <Field label={t("Search", "Buscar")}>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Name, email, code, job title...", "Nombre, correo, codigo, cargo...")}
            />
          </Field>
          <Field label={t("Role", "Rol")}>
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | UserRole)}>
              <option value="all">{t("All roles", "Todos los roles")}</option>
              <option value="admin">{t("Administrator", "Administrador")}</option>
              <option value="operator">{t("Operator", "Operador")}</option>
            </Select>
          </Field>
          <Field label={t("Status", "Estado")}>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "blocked" | "open")}>
              <option value="all">{t("All statuses", "Todos los estados")}</option>
              <option value="active">{t("Active", "Activo")}</option>
              <option value="blocked">{t("Blocked", "Bloqueado")}</option>
              <option value="open">{t("Open shift", "Turno abierto")}</option>
            </Select>
          </Field>
          <Field label={t("Store", "Store")}>
            <Select value={storeFilter} onChange={(event) => setStoreFilter(event.target.value as "all" | StoreName)}>
              <option value="all">{t("All stores", "Todas las stores")}</option>
              {availableLocations.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
              {t("Weekly view", "Vista semanal")}
            </p>
            <p className="text-sm text-stone-200">
              {selectedWeekRange.start} → {selectedWeekRange.end}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setWeekOffset((current) => current - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setWeekOffset(0)}>
              {t("This week", "Esta semana")}
            </Button>
            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => setWeekOffset((current) => current + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.03]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("User", "Usuario")}</TableHead>
                <TableHead>{t("Role", "Rol")}</TableHead>
                <TableHead>{t("Status", "Estado")}</TableHead>
                <TableHead>{t("Store", "Store")}</TableHead>
                <TableHead>{t("Hours today", "Horas hoy")}</TableHead>
                <TableHead>{t("Week", "Semana")}</TableHead>
                <TableHead>{t("Shift", "Turno")}</TableHead>
                <TableHead>{t("Last activity", "Ultima actividad")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSummaries.map((entry) => {
                const user = users.find((candidate) => candidate.id === entry.userId);
                const isExpanded = expandedUserId === entry.userId;
                return (
                  <Fragment key={entry.userId}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedUserId((current) => (current === entry.userId ? null : entry.userId))}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-white">{entry.fullName}</div>
                          <div className="text-xs text-stone-400">
                            {entry.email} · {entry.employeeCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.role === "admin" ? t("Administrator", "Administrador") : t("Operator", "Operador")}</TableCell>
                      <TableCell>
                        {entry.isBlocked ? (
                          <Badge variant="destructive" className="border-red-400/20 bg-red-500/15 text-red-100">
                            {t("Blocked", "Bloqueado")}
                          </Badge>
                        ) : (
                          <Badge variant="success" className="border-emerald-400/20 bg-emerald-500/15 text-emerald-100">
                            {t("Active", "Activo")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{entry.lastStore || entry.store}</div>
                          <div className="text-xs text-stone-400">{entry.jobTitle}</div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.workedTodayHours.toFixed(2)}h</TableCell>
                      <TableCell>{entry.workedWeekHours.toFixed(2)}h</TableCell>
                      <TableCell>
                        {entry.openShiftCount > 0 ? (
                          <div className="space-y-1">
                            <Badge variant="warning" className="border-amber-400/20 bg-amber-400/15 text-amber-100">
                              {t("Open", "Abierto")}
                            </Badge>
                            <div className="text-xs text-stone-400">{formatMinutesAsHours(entry.currentShiftMinutes)}</div>
                            <div className="text-xs text-stone-500">
                              {t("Store", "Store")}: {entry.openShiftStore ?? entry.lastStore}
                            </div>
                          </div>
                        ) : (
                          <span className="text-stone-400">{t("Closed", "Cerrado")}</span>
                        )}
                      </TableCell>
                      <TableCell>{entry.lastActivityAt ? formatTimestamp(entry.lastActivityAt, language) : "-"}</TableCell>
                    </TableRow>
                    {isExpanded && user ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="bg-white/[0.03] px-4 py-4">
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="grid gap-2 text-sm text-stone-300 sm:grid-cols-2 xl:grid-cols-4">
                                <div>
                                  <span className="text-stone-500">{t("Job title", "Cargo")}:</span> {entry.jobTitle}
                                </div>
                                <div>
                                  <span className="text-stone-500">{t("Default store", "Store predeterminada")}:</span> {entry.store}
                                </div>
                                <div>
                                  <span className="text-stone-500">{t("Open shifts", "Turnos abiertos")}:</span> {entry.openShiftCount}
                                </div>
                                <div>
                                  <span className="text-stone-500">{t("Current shift", "Turno actual")}:</span>{" "}
                                  {entry.currentShiftMinutes > 0 ? formatMinutesAsHours(entry.currentShiftMinutes) : "-"}
                                </div>
                                <div>
                                  <span className="text-stone-500">{t("Open shift store", "Store del turno abierto")}:</span>{" "}
                                  {entry.openShiftStore ?? "-"}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-full border border-white/10 bg-white/90 text-stone-900 hover:bg-white"
                                  onClick={() => setPayrollUserId(user.id)}
                                >
                                  <Clock3 className="mr-2 h-4 w-4" />
                                  {t("Liquidate", "Liquidar")}
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-full border border-white/10 bg-white/90 text-stone-900 hover:bg-white"
                                  onClick={() => onEditUser(user)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t("Edit user", "Editar usuario")}
                                </Button>
                                <Button
                                  type="button"
                                  variant={user.isBlocked ? "secondary" : "outline"}
                                  size="sm"
                                  className={user.isBlocked ? "rounded-full border border-white/10 bg-white/90 text-stone-900 hover:bg-white" : "rounded-full border-white/15 bg-white/5 text-stone-100 hover:bg-white/10"}
                                  disabled={currentUserId === user.id}
                                  onClick={() => onRequestBlockToggle(user)}
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  {user.isBlocked ? t("Unblock user", "Desbloquear usuario") : t("Block user", "Bloquear usuario")}
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-full border border-red-400/20 bg-red-500/85 text-white hover:bg-red-500"
                                  disabled={currentUserId === user.id}
                                  onClick={() => onRequestDelete(user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("Delete user", "Eliminar usuario")}
                                </Button>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                                  {t("Week breakdown", "Desglose semanal")}
                                </p>
                                <p className="text-sm text-stone-300">
                                  {t("Hours worked each day", "Horas trabajadas cada dia")}
                                </p>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                                {entry.weekDailyHours.map((day) => {
                                  const label = weekdayFormatter.format(new Date(`${day.date}T12:00:00`));
                                  return (
                                    <div
                                      key={day.date}
                                      className="rounded-2xl border border-white/10 bg-stone-950/50 px-3 py-3"
                                    >
                                      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
                                      <p className="mt-1 text-sm text-stone-400">{day.date}</p>
                                      <p className="mt-3 text-2xl font-semibold text-white">{day.hours.toFixed(2)}h</p>
                                      <div className="mt-3 space-y-1 text-xs text-stone-400">
                                        <p>
                                          {t("In", "Entrada")}: {day.clockIn ?? "-"}
                                        </p>
                                        <p>
                                          {t("Out", "Salida")}: {day.clockOut ?? "-"}
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="mt-3 rounded-full"
                                        onClick={() => {
                                          const existingAttendance = attendanceByUserAndDate.get(
                                            `${entry.employeeCode}::${day.date}`
                                          );
                                          setAttendanceCorrectionTarget({
                                            user,
                                            date: day.date,
                                          });
                                          setAttendanceCorrectionForm({
                                            clockIn: existingAttendance?.clockIn ?? "",
                                            clockOut: existingAttendance?.clockOut ?? "",
                                            store:
                                              existingAttendance?.store ??
                                              entry.openShiftStore ??
                                              entry.lastStore ??
                                              user.store,
                                            notes: existingAttendance?.notes ?? "",
                                          });
                                        }}
                                      >
                                        {t("Adjust", "Ajustar")}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={Boolean(payrollUserId)} onOpenChange={(open) => !open && setPayrollUserId(null)}>
        <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedPayrollUser
                ? t(`Payroll for ${selectedPayrollUser.fullName}`, `Liquidacion de ${selectedPayrollUser.fullName}`)
                : t("User payroll", "Liquidacion del usuario")}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {selectedPayrollData
                ? t(
                    `Choose the payroll period you want to review for this user.`,
                    `Elige el periodo de liquidacion que quieres revisar para este usuario.`
                  )
                : t(
                    "Choose the payroll period you want to review for this user.",
                    "Elige el periodo de liquidacion que quieres revisar para este usuario."
                  )}
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <Field label={t("Payroll period", "Periodo a liquidar")}>
              <Select value={payrollPeriod} onChange={(event) => setPayrollPeriod(event.target.value as SalesPeriodPreset)}>
                <option value="today">{t("Today", "Hoy")}</option>
                <option value="yesterday">{t("Yesterday", "Ayer")}</option>
                <option value="week">{t("This week", "Esta semana")}</option>
                <option value="month">{t("This month", "Este mes")}</option>
                <option value="year">{t("This year", "Este ano")}</option>
                <option value="custom">{t("Custom range", "Rango personalizado")}</option>
              </Select>
            </Field>
            {payrollPeriod !== "custom" ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-300">
                {t("Selected range", "Rango seleccionado")}: {payrollRange.start} → {payrollRange.end}
              </div>
            ) : null}
          </div>

          {payrollPeriod === "custom" ? (
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <Field label={t("From", "Desde")}>
                <Input type="date" value={payrollCustomStart} onChange={(event) => setPayrollCustomStart(event.target.value)} />
              </Field>
              <Field label={t("To", "Hasta")}>
                <Input type="date" value={payrollCustomEnd} onChange={(event) => setPayrollCustomEnd(event.target.value)} />
              </Field>
            </div>
          ) : null}

          {selectedPayrollSummary ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label={t("Regular hours", "Horas regulares")} value={selectedPayrollSummary.regularHours.toFixed(2)} />
                <MiniStat label={t("Overtime", "Horas extra")} value={selectedPayrollSummary.overtimeHours.toFixed(2)} />
                <MiniStat label={t("Total hours", "Horas totales")} value={selectedPayrollSummary.totalHours.toFixed(2)} />
                <MiniStat label={t("Open shifts", "Turnos abiertos")} value={String(selectedPayrollSummary.openShiftCount)} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-300">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-stone-500">{t("Employee", "Empleado")}:</span> {selectedPayrollUser?.fullName}
                  </div>
                  <div>
                    <span className="text-stone-500">{t("Clock-in code", "Codigo de clock-in")}:</span> {selectedPayrollUser?.employeeCode}
                  </div>
                  <div>
                    <span className="text-stone-500">{t("Job title", "Cargo")}:</span> {selectedPayrollUser?.jobTitle}
                  </div>
                  <div>
                    <span className="text-stone-500">{t("Stores", "Stores")}:</span> {selectedPayrollSummary.stores.join(", ") || "-"}
                  </div>
                </div>

                <p className="mt-3 text-stone-400">
                  {t("Range", "Rango")}: {payrollRange.start} → {payrollRange.end}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="secondary" onClick={handleDownloadPayrollPdf}>
                  {t("Download PDF", "Descargar PDF")}
                </Button>
                <Button type="button" variant="secondary" onClick={handleDownloadPayrollCsv}>
                  {t("Download Excel", "Descargar Excel")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPayrollUserId(null)}>
                  {t("Close", "Cerrar")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              {t(
                "There are no payroll hours yet for this user in the selected period.",
                "Aun no hay horas de nomina para este usuario en el periodo seleccionado."
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(attendanceCorrectionTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAttendanceCorrectionTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">
              {attendanceCorrectionTarget
                ? t(
                    `Adjust attendance for ${attendanceCorrectionTarget.user.fullName}`,
                    `Ajustar asistencia de ${attendanceCorrectionTarget.user.fullName}`
                  )
                : t("Adjust attendance", "Ajustar asistencia")}
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              {attendanceCorrectionTarget
                ? t(
                    `Use this to correct clock-in or clock-out for ${attendanceCorrectionTarget.date}.`,
                    `Usa esto para corregir entrada o salida del ${attendanceCorrectionTarget.date}.`
                  )
                : ""}
            </DialogDescription>
          </DialogHeader>

          {attendanceCorrectionTarget ? (
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const saved = onSaveAttendanceCorrection({
                  user: attendanceCorrectionTarget.user,
                  date: attendanceCorrectionTarget.date,
                  clockIn: attendanceCorrectionForm.clockIn,
                  clockOut: attendanceCorrectionForm.clockOut,
                  store: attendanceCorrectionForm.store,
                  notes: attendanceCorrectionForm.notes,
                });
                if (!saved) return;
                setAttendanceCorrectionTarget(null);
              }}
            >
              <Field label={t("Date", "Fecha")} className="md:col-span-2">
                <Input value={attendanceCorrectionTarget.date} readOnly />
              </Field>
              <Field label={t("Clock-in", "Entrada")}>
                <Input
                  type="time"
                  value={attendanceCorrectionForm.clockIn}
                  onChange={(event) =>
                    setAttendanceCorrectionForm((current) => ({
                      ...current,
                      clockIn: event.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label={t("Clock-out", "Salida")}>
                <Input
                  type="time"
                  value={attendanceCorrectionForm.clockOut}
                  onChange={(event) =>
                    setAttendanceCorrectionForm((current) => ({
                      ...current,
                      clockOut: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label={t("Store", "Store")}>
                <Select
                  value={attendanceCorrectionForm.store}
                  onChange={(event) =>
                    setAttendanceCorrectionForm((current) => ({
                      ...current,
                      store: event.target.value,
                    }))
                  }
                >
                  {availableLocations.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("Notes", "Notas")} className="md:col-span-2">
                <Input
                  value={attendanceCorrectionForm.notes}
                  onChange={(event) =>
                    setAttendanceCorrectionForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder={t("Optional note", "Nota opcional")}
                />
              </Field>
              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setAttendanceCorrectionTarget(null)}>
                  {t("Cancel", "Cancelar")}
                </Button>
                <Button type="submit">{t("Save attendance", "Guardar asistencia")}</Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
