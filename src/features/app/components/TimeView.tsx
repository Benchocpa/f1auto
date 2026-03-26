import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, LogIn, LogOut } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { createAttendanceForm } from "../config";
import type {
  AttendanceEntry,
  AttendanceFormState,
  Language,
  StoreName,
  Translate,
  UserEntry,
} from "../types";
import {
  formatDateWithWeekday,
  formatDuration,
  formatMinutesAsHours,
  getOpenShiftMinutes,
} from "../utils";
import { Field } from "./common";

const SHIFT_ALERT_THRESHOLD_MINUTES = 12 * 60;

interface TimeViewProps {
  activeShifts: AttendanceEntry[];
  activeStore: StoreName;
  attendanceByStore: AttendanceEntry[];
  attendanceForm: AttendanceFormState;
  language: Language;
  onClockIn: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenClockOutModal: (entry: AttendanceEntry) => void;
  selectedEmployee: UserEntry | null;
  setAttendanceForm: React.Dispatch<React.SetStateAction<AttendanceFormState>>;
  t: Translate;
}

export function TimeView({
  activeShifts,
  activeStore,
  attendanceByStore,
  attendanceForm,
  language,
  onClockIn,
  onOpenClockOutModal,
  selectedEmployee,
  setAttendanceForm,
  t,
}: TimeViewProps) {
  const [now, setNow] = useState(() => new Date());
  const codeDigits = attendanceForm.employeeCode.replace(/\D/g, "").slice(0, 4);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  const alertedShiftIds = useMemo(
    () =>
      new Set(
        activeShifts
          .filter((entry) => {
            const openMinutes = getOpenShiftMinutes(entry.date, entry.clockIn, now);
            return openMinutes !== null && openMinutes >= SHIFT_ALERT_THRESHOLD_MINUTES;
          })
          .map((entry) => entry.id)
      ),
    [activeShifts, now]
  );

  const alertedShifts = useMemo(
    () => activeShifts.filter((entry) => alertedShiftIds.has(entry.id)),
    [activeShifts, alertedShiftIds]
  );

  const appendDigit = (digit: string) => {
    if (codeDigits.length >= 4) return;

    setAttendanceForm((current) => ({
      ...current,
      employeeCode: `${current.employeeCode.replace(/\D/g, "").slice(0, 4)}${digit}`.slice(0, 4),
    }));
  };

  const removeDigit = () => {
    setAttendanceForm((current) => ({
      ...current,
      employeeCode: current.employeeCode.replace(/\D/g, "").slice(0, -1),
    }));
  };

  const clearCode = () => {
    setAttendanceForm((current) => ({
      ...current,
      employeeCode: "",
      employeeName: "",
      role: "",
      notes: current.notes,
      store: current.store,
    }));
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"] as const;

  return (
    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Time control", "Control de tiempo")}</p>
            <h2 className="panel-title">
              {t("Employee clock-in and clock-out", "Entrada y salida de empleados")}
            </h2>
          </div>
          <Badge variant="secondary">{activeStore}</Badge>
        </div>

        <form className="grid gap-4" onSubmit={onClockIn}>
          <Field label={t("Employee code", "Codigo de empleado")}>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-stone-900 text-3xl font-semibold text-white shadow-sm sm:h-20 sm:text-4xl"
                  >
                    {codeDigits[index] ? "•" : ""}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {keypad.map((key) => {
                  if (key === "clear") {
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="secondary"
                        className="h-16 rounded-2xl text-base sm:h-20 sm:text-lg"
                        onClick={clearCode}
                      >
                        {t("Clear", "Limpiar")}
                      </Button>
                    );
                  }

                  if (key === "backspace") {
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant="secondary"
                        className="h-16 rounded-2xl text-base sm:h-20 sm:text-lg"
                        onClick={removeDigit}
                      >
                        {t("Delete", "Borrar")}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      className="h-16 rounded-2xl border-white/20 bg-white text-2xl font-semibold text-stone-950 hover:bg-stone-200 sm:h-20 sm:text-3xl"
                      onClick={() => appendDigit(key)}
                    >
                      {key}
                    </Button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-stone-400">
              {selectedEmployee
                ? `${selectedEmployee.fullName} · ${selectedEmployee.jobTitle}`
                : t(
                    "Tap the 4-digit code assigned to the employee.",
                    "Toca el codigo de 4 digitos asignado al empleado."
                  )}
            </p>
          </Field>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
              {t("Employee detected", "Empleado detectado")}
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {attendanceForm.employeeName || t("Waiting for code", "Esperando codigo")}
            </p>
            <p className="mt-1 text-sm text-stone-300">
              {attendanceForm.role || t("Role will appear automatically", "El cargo aparecera automaticamente")}
            </p>
          </div>

          <Field label={t("Notes", "Notas")}>
            <Textarea
              value={attendanceForm.notes}
              onChange={(event) =>
                setAttendanceForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder={t("Shift notes", "Observaciones del turno")}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="h-14 rounded-2xl px-6 text-base sm:h-16 sm:px-8 sm:text-lg">
              <LogIn className="mr-2 h-4 w-4" />
              {t("Clock in", "Marcar entrada")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-14 rounded-2xl px-6 text-base sm:h-16 sm:px-8 sm:text-lg"
              onClick={() => setAttendanceForm(createAttendanceForm(activeStore))}
            >
              {t("Clear", "Limpiar")}
            </Button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Shifts and attendance", "Turnos y asistencia")}</p>
            <h2 className="panel-title">{t("Team summary", "Resumen del personal")}</h2>
          </div>
          <Badge variant="secondary">
            {activeShifts.length} {t("active", "activos")}
          </Badge>
        </div>

        <div className="space-y-3">
          {alertedShifts.length ? (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                    {t("Shift alert", "Alarma de turno")}
                  </p>
                  <p className="mt-1 text-sm leading-6">
                    {t(
                      "One or more employees have been clocked in for over 12 hours. Check whether they are still working or forgot to clock out.",
                      "Uno o mas empleados llevan mas de 12 horas con turno abierto. Revisa si siguen trabajando o si olvidaron marcar la salida."
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {activeShifts.length ? (
            activeShifts.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-2xl p-4 ${
                  alertedShiftIds.has(entry.id)
                    ? "border border-red-400/40 bg-red-500/10"
                    : "border border-white/10 bg-white/5"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-white">{entry.employeeName}</p>
                      {alertedShiftIds.has(entry.id) ? (
                        <Badge variant="destructive">{t("12h alert", "Alerta 12h")}</Badge>
                      ) : null}
                    </div>
                    <p className={`text-sm ${alertedShiftIds.has(entry.id) ? "text-red-100" : "text-stone-300"}`}>
                      {entry.role} · {t("Clock in", "Entrada")} {entry.clockIn}
                    </p>
                    {(() => {
                      const openMinutes = getOpenShiftMinutes(entry.date, entry.clockIn, now);
                      if (openMinutes === null) return null;

                      return (
                        <p className={`mt-1 text-sm ${alertedShiftIds.has(entry.id) ? "text-red-100" : "text-stone-400"}`}>
                          {t("Open shift time", "Tiempo con turno abierto")}: {formatMinutesAsHours(openMinutes)}
                        </p>
                      );
                    })()}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 bg-white text-stone-950 hover:bg-stone-200"
                    onClick={() => onOpenClockOutModal(entry)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("Clock out", "Marcar salida")}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
              {t(
                "There are no employees with an open shift in this store.",
                "No hay empleados con turno abierto en esta tienda."
              )}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="space-y-3">
            {attendanceByStore.length ? (
              attendanceByStore.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{entry.employeeName}</p>
                      <p className="text-sm text-stone-300">
                        {entry.role} · {formatDateWithWeekday(entry.date, language)}
                      </p>
                    </div>
                    <Badge variant={entry.clockOut ? "success" : "warning"}>
                      {entry.clockOut ? t("Closed", "Cerrado") : t("Open", "Abierto")}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-stone-300">
                    <span>{t("Clock in", "Entrada")}: {entry.clockIn}</span>
                    <span>{t("Clock out", "Salida")}: {entry.clockOut ?? t("Pending", "Pendiente")}</span>
                    <span>{t("Time", "Tiempo")}: {formatDuration(entry.clockIn, entry.clockOut, language)}</span>
                    {entry.notes ? <span>{t("Notes", "Notas")}: {entry.notes}</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                {t(
                  "There are no attendance records in this store.",
                  "No hay movimientos de asistencia registrados en esta tienda."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
