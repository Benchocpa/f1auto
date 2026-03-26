import { useEffect, useState } from "react";
import { Clock3, LayoutDashboard, TimerReset, Users, CarFront, Pencil, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import type {
  AdminStoreStat,
  DeviceStoreSettings,
  Language,
  PayrollEmployeeSummary,
  StoreEntry,
  StoreFormState,
  StoreName,
  Translate,
  VehicleEntry,
} from "../types";
import { formatCurrency, formatDateWithWeekday } from "../utils";
import { BRAND_LOGO_OPTIONS, LocationBrand, MiniStat, StatCard, Field } from "./common";

interface AdminViewProps {
  adminStoreStats: AdminStoreStat[];
  availableLocations: string[];
  configuredLocationLabel: string;
  deleteStoreFeedback: string | null;
  configuredLocationLogoKey: string;
  configuredLocationSubtitle: string;
  deleteStoreTarget: StoreEntry | null;
  language: Language;
  onClosePayrollPeriod: (adminPin: string) => boolean;
  onDeleteStore: (adminPin: string) => boolean;
  onExportDailyBillingCsv: () => void;
  onExportPayrollCsv: () => void;
  onJumpToStore: (store: StoreName) => void;
  onPrintDailyBilling: () => void;
  onPrintPayrollSummary: () => void;
  onResetDemoData: () => void;
  onSendReportPreview: () => void;
  onStoreSettingsOpenChange: (open: boolean) => void;
  onStoreSettingsSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStoreSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  payrollClosedAtLabel: string;
  payrollSummaries: PayrollEmployeeSummary[];
  payrollTotals: {
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
  };
  reportCompleted: number;
  reportStore: StoreName;
  reportTotal: number;
  reportVehicles: VehicleEntry[];
  setDeleteStoreFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  setReportStore: React.Dispatch<React.SetStateAction<StoreName>>;
  setDeleteStoreTarget: React.Dispatch<React.SetStateAction<StoreEntry | null>>;
  setEditingStoreId: React.Dispatch<React.SetStateAction<string | null>>;
  setStoreSettingsForm: React.Dispatch<React.SetStateAction<DeviceStoreSettings>>;
  setStoreForm: React.Dispatch<React.SetStateAction<StoreFormState>>;
  storeSettings: DeviceStoreSettings;
  storeSettingsForm: DeviceStoreSettings;
  stores: StoreEntry[];
  storeForm: StoreFormState;
  t: Translate;
  totalEmployees: number;
  totalOpenShifts: number;
  totalVehicles: number;
  vehicles: VehicleEntry[];
  isStoreSettingsOpen: boolean;
  isStoreModalOpen: boolean;
  editingStoreId: string | null;
  setIsStoreModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AdminView({
  adminStoreStats,
  availableLocations,
  configuredLocationLabel,
  deleteStoreFeedback,
  configuredLocationLogoKey,
  configuredLocationSubtitle,
  deleteStoreTarget,
  editingStoreId,
  isStoreModalOpen,
  isStoreSettingsOpen,
  language,
  onClosePayrollPeriod,
  onDeleteStore,
  onExportDailyBillingCsv,
  onExportPayrollCsv,
  onJumpToStore,
  onPrintDailyBilling,
  onPrintPayrollSummary,
  onResetDemoData,
  onSendReportPreview,
  onStoreSettingsOpenChange,
  onStoreSettingsSubmit,
  onStoreSubmit,
  payrollClosedAtLabel,
  payrollSummaries,
  payrollTotals,
  reportCompleted,
  reportStore,
  reportTotal,
  reportVehicles,
  setDeleteStoreFeedback,
  setReportStore,
  setDeleteStoreTarget,
  setEditingStoreId,
  setIsStoreModalOpen,
  setStoreSettingsForm,
  setStoreForm,
  storeSettings,
  storeSettingsForm,
  storeForm,
  stores,
  t,
  totalEmployees,
  totalOpenShifts,
  totalVehicles,
  vehicles,
}: AdminViewProps) {
  const [isPayrollCloseDialogOpen, setIsPayrollCloseDialogOpen] = useState(false);
  const [payrollClosePin, setPayrollClosePin] = useState("");
  const [deleteStorePin, setDeleteStorePin] = useState("");
  const globalPending = adminStoreStats.reduce((sum, item) => sum + item.pending, 0);
  const globalSales = adminStoreStats.reduce((sum, item) => sum + item.salesToday, 0);
  const globalMakes = Array.from(
    new Set(
      vehicles
        .map((entry) => entry.make.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
    )
  );

  useEffect(() => {
    if (!deleteStoreTarget) {
      setDeleteStorePin("");
      setDeleteStoreFeedback(null);
    }
  }, [deleteStoreTarget, setDeleteStoreFeedback]);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<LayoutDashboard className="h-5 w-5" />}
          label={t("Locations", "Ubicaciones")}
          value={String(availableLocations.length)}
          detail={t("Full operating coverage", "Cobertura operativa total")}
        />
        <StatCard
          icon={<CarFront className="h-5 w-5" />}
          label={t("Vehicles", "Vehiculos")}
          value={String(totalVehicles)}
          detail={t(`Global pending ${globalPending}`, `Pendientes globales ${globalPending}`)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("Employees", "Empleados")}
          value={String(totalEmployees)}
          detail={t(`${totalOpenShifts} open shifts now`, `${totalOpenShifts} turnos abiertos ahora`)}
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5" />}
          label={t("Sales today", "Ventas hoy")}
          value={formatCurrency(globalSales)}
          detail={t("Combined across all locations", "Consolidado de todas las ubicaciones")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {adminStoreStats.map((item) => (
          <article key={item.store} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{t("Location", "Ubicacion")}</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{item.store}</h3>
              </div>
              <Button type="button" variant="secondary" onClick={() => onJumpToStore(item.store)}>
                {t("View details", "Ver detalle")}
              </Button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat label={t("Vehicles", "Vehiculos")} value={String(item.vehicles)} />
              <MiniStat label={t("Pending", "Pendientes")} value={String(item.pending)} />
              <MiniStat label={t("Employees", "Empleados")} value={String(item.employees)} />
              <MiniStat label={t("Open shifts", "Turnos abiertos")} value={String(item.openShifts)} />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
              {t("Today's sales", "Ventas del dia")}: {formatCurrency(item.salesToday)}
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Stores", "Stores")}</p>
              <h2 className="panel-title">{t("Manage stores", "Administrar stores")}</h2>
            </div>
            <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingStoreId(null);
                    setStoreForm({ name: "", address: "", phone: "", logoKey: "" });
                  }}
                >
                  {t("Create store", "Crear store")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingStoreId ? t("Edit store", "Editar store") : t("Create store", "Crear store")}
                  </DialogTitle>
                  <DialogDescription className="text-stone-400">
                    {t(
                      "Create or update the central store catalog with name, address, phone, and logo.",
                      "Crea o actualiza el catalogo central de stores con nombre, direccion, telefono y logo."
                    )}
                  </DialogDescription>
                </DialogHeader>

                <form className="grid gap-4 md:grid-cols-2" onSubmit={onStoreSubmit}>
                  <Field label={t("Store name", "Nombre de la store")}>
                    <Input
                      value={storeForm.name}
                      onChange={(event) =>
                        setStoreForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder={t("Mercedes, Porsche, Honda...", "Mercedes, Porsche, Honda...")}
                      required
                    />
                  </Field>

                  <Field label={t("Brand logo", "Logo de marca")}>
                    <Select
                      value={storeForm.logoKey}
                      onChange={(event) =>
                        setStoreForm((current) => ({ ...current, logoKey: event.target.value }))
                      }
                    >
                      {BRAND_LOGO_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label={t("Address", "Direccion")} className="md:col-span-2">
                    <Input
                      value={storeForm.address}
                      onChange={(event) =>
                        setStoreForm((current) => ({ ...current, address: event.target.value }))
                      }
                    />
                  </Field>

                  <Field label={t("Phone", "Telefono")} className="md:col-span-2">
                    <Input
                      value={storeForm.phone}
                      onChange={(event) =>
                        setStoreForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </Field>

                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button type="submit">{editingStoreId ? t("Update store", "Actualizar store") : t("Save store", "Guardar store")}</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingStoreId(null);
                        setStoreForm({ name: "", address: "", phone: "", logoKey: "" });
                      }}
                    >
                      {t("Clear", "Limpiar")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {stores.length ? (
              stores.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-stone-900/70 px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-white">{entry.name}</p>
                      <p className="mt-1 text-sm text-stone-300">{[entry.address, entry.phone].filter(Boolean).join(" · ") || t("No contact details yet.", "Aun sin datos de contacto.")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingStoreId(entry.id);
                          setStoreForm({
                            name: entry.name,
                            address: entry.address,
                            phone: entry.phone,
                            logoKey: entry.logoKey,
                          });
                          setIsStoreModalOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("Edit", "Editar")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteStoreFeedback(null);
                          setDeleteStoreTarget(entry);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("Delete", "Eliminar")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                {t("There are no stores yet. Create the first one here.", "Aun no hay stores. Crea la primera aqui.")}
              </div>
            )}
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Equipment settings", "Configuracion del equipo")}</p>
              <h2 className="panel-title">{t("Configured location for this computer", "Ubicacion configurada para esta computadora")}</h2>
            </div>
            <Badge variant="secondary">{configuredLocationLabel}</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <LocationBrand
                title={configuredLocationLabel}
                subtitle={configuredLocationSubtitle}
                logoKey={configuredLocationLogoKey}
                compact
              />
              <p className="mt-4 text-sm text-stone-300">{storeSettings.store}</p>
              {configuredLocationSubtitle ? <p className="mt-3 text-sm text-stone-300">{configuredLocationSubtitle}</p> : null}
            </div>

            <Dialog open={isStoreSettingsOpen} onOpenChange={onStoreSettingsOpenChange}>
              <DialogTrigger asChild>
                <Button type="button">{t("Configure location", "Configurar ubicacion")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
                <DialogHeader>
                  <DialogTitle className="text-white">{t("Configure this computer", "Configurar esta computadora")}</DialogTitle>
                  <DialogDescription className="text-stone-400">
                    {t(
                      "Define the agency or location name, address, phone, and logo for this computer. The location record will also be saved centrally.",
                      "Define el nombre de agencia o ubicacion, direccion, telefono y logo para esta computadora. El registro de la ubicacion tambien se guardara de forma central."
                    )}
                  </DialogDescription>
                </DialogHeader>

                <form className="grid gap-4 md:grid-cols-2" onSubmit={onStoreSettingsSubmit}>
                  <Field label={t("Default store for this computer", "Store predeterminada para esta computadora")} className="md:col-span-2">
                    <Select
                      value={storeSettingsForm.store}
                      onChange={(event) =>
                        setStoreSettingsForm((current) => ({ ...current, store: event.target.value }))
                      }
                    >
                      {stores.map((entry) => (
                        <option key={entry.id} value={entry.name}>
                          {entry.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <Button type="submit">{t("Save configuration", "Guardar configuracion")}</Button>
                    <Button type="button" variant="secondary" onClick={() => onStoreSettingsOpenChange(false)}>
                      {t("Cancel", "Cancelar")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Time control", "Control de tiempo")}</p>
              <h2 className="panel-title">{t("Payroll summary and overtime", "Resumen de nomina y horas extra")}</h2>
            </div>
            <Badge variant="secondary">{reportStore}</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <Field label={t("Location for payroll", "Ubicacion para nomina")}>
                <Select value={reportStore} onChange={(event) => setReportStore(event.target.value as StoreName)}>
                  {availableLocations.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStat label={t("Regular hours", "Horas regulares")} value={payrollTotals.regularHours.toFixed(2)} />
                <MiniStat label={t("Overtime", "Horas extra")} value={payrollTotals.overtimeHours.toFixed(2)} />
                <MiniStat label={t("Total hours", "Horas totales")} value={payrollTotals.totalHours.toFixed(2)} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
                {t("Current payroll period starts after", "El periodo actual de nomina empieza despues de")}: {payrollClosedAtLabel}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={onExportPayrollCsv}>
                  {t("Export Excel", "Exportar Excel")}
                </Button>
                <Button type="button" variant="secondary" onClick={onPrintPayrollSummary}>
                  {t("Export PDF", "Exportar PDF")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setPayrollClosePin("");
                    setIsPayrollCloseDialogOpen(true);
                  }}
                >
                  {t("Close payroll", "Cerrar nomina")}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{t("Payroll details", "Detalle de nomina")}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {t("Employee hours for current period", "Horas de empleados del periodo actual")}
                </h3>
              </div>

              <div className="space-y-3">
                {payrollSummaries.length ? (
                  payrollSummaries.map((entry) => (
                    <div key={entry.userId} className="rounded-2xl border border-white/10 bg-stone-900/70 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">{entry.employeeName}</p>
                          <p className="text-sm text-stone-300">{entry.employeeCode} · {entry.jobTitle}</p>
                        </div>
                        {entry.overtimeHours > 0 ? (
                          <Badge variant="warning">{t("Overtime", "Horas extra")}: {entry.overtimeHours.toFixed(2)}</Badge>
                        ) : (
                          <Badge variant="secondary">{t("Regular", "Regular")}</Badge>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                        <span>{t("Regular", "Regulares")}: {entry.regularHours.toFixed(2)}</span>
                        <span>{t("Overtime", "Extra")}: {entry.overtimeHours.toFixed(2)}</span>
                        <span>{t("Total", "Total")}: {entry.totalHours.toFixed(2)}</span>
                        <span>{t("Open shifts", "Turnos abiertos")}: {entry.openShiftCount}</span>
                      </div>

                      {entry.alertCount ? (
                        <p className="mt-3 text-sm text-amber-300">
                          {t("Shift alerts", "Alertas de turno")}: {entry.alertCount}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                    {t("There are no payroll hours yet for this location.", "Aun no hay horas de nomina para esta ubicacion.")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Dialog open={isPayrollCloseDialogOpen} onOpenChange={setIsPayrollCloseDialogOpen}>
            <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {t("Confirm payroll close", "Confirmar cierre de nomina")}
                </DialogTitle>
                <DialogDescription className="text-stone-400">
                  {t(
                    `Enter the administrator PIN to close payroll for ${reportStore}. This will restart the current period counters without deleting the history.`,
                    `Ingresa el PIN del administrador para cerrar la nomina de ${reportStore}. Esto reiniciara los contadores del periodo actual sin borrar el historial.`
                  )}
                </DialogDescription>
              </DialogHeader>

              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const closed = onClosePayrollPeriod(payrollClosePin);
                  if (!closed) return;
                  setIsPayrollCloseDialogOpen(false);
                  setPayrollClosePin("");
                }}
              >
                <Field label={t("Administrator PIN", "PIN del administrador")}>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={payrollClosePin}
                    onChange={(event) =>
                      setPayrollClosePin(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="1234"
                    required
                  />
                </Field>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsPayrollCloseDialogOpen(false);
                      setPayrollClosePin("");
                    }}
                  >
                    {t("Cancel", "Cancelar")}
                  </Button>
                  <Button type="submit" variant="destructive">
                    {t("Close payroll", "Cerrar nomina")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Daily report", "Informe diario")}</p>
              <h2 className="panel-title">{t("Daily billing statement", "Cuenta de cobro diaria")}</h2>
            </div>
            <Badge variant="secondary">{reportStore}</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <Field label={t("Location for report", "Ubicacion del informe")}>
                <Select value={reportStore} onChange={(event) => setReportStore(event.target.value as StoreName)}>
                  {availableLocations.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <MiniStat label={t("Vehicles today", "Vehiculos de hoy")} value={String(reportVehicles.length)} />
                <MiniStat label={t("Completed", "Terminados")} value={String(reportCompleted)} />
                <MiniStat label={t("Pending", "Pendientes")} value={String(reportVehicles.length - reportCompleted)} />
                <MiniStat label={t("Total sales", "Total vendido")} value={formatCurrency(reportTotal)} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
                {t("Billing date", "Fecha del cobro")}: {formatDateWithWeekday(new Date().toISOString().slice(0, 10), language)}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={onSendReportPreview}>
                  {t("Send billing", "Enviar cobro")}
                </Button>
                <Button type="button" variant="secondary" onClick={onPrintDailyBilling}>
                  {t("Download PDF", "Descargar PDF")}
                </Button>
                <Button type="button" variant="secondary" onClick={onExportDailyBillingCsv}>
                  {t("Download Excel", "Descargar Excel")}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{t("Billing preview", "Vista previa del cobro")}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {t("Vehicles billed together for this location", "Vehiculos cobrados en conjunto para esta ubicacion")} · {reportStore}
                </h3>
              </div>

              <div className="space-y-3">
                {reportVehicles.length ? (
                  reportVehicles.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-stone-900/70 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-white">{entry.make} {entry.model}</p>
                          <p className="text-sm text-stone-300">{entry.stock} · {entry.salesPerson}</p>
                        </div>
                        <Badge variant={entry.status === "Entregado" ? "success" : "warning"}>
                          {entry.status === "Entregado" ? t("Complete", "Completo") : t("Pending", "Pendiente")}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                        <span>{t("Drop-off", "Entrada")}: {entry.time}</span>
                        <span>{t("Pickup", "Recogida")}: {entry.pickupTime || "-"}</span>
                        <span>{t("Service", "Servicio")}: {entry.simo || "-"}</span>
                        <span>{t("Price", "Precio")}: {formatCurrency(entry.price)}</span>
                        <span>{t("VIN", "VIN")}: {entry.vin || "-"}</span>
                        <span>{t("Date", "Fecha")}: {formatDateWithWeekday(entry.date, language)}</span>
                      </div>

                      {entry.comments ? (
                        <p className="mt-3 text-sm text-stone-400">
                          {t("Comments", "Comentarios")}: {entry.comments}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                    {t("There are no vehicles registered today for this location.", "No hay vehiculos registrados hoy para esta ubicacion.")}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {t("Total amount due", "Monto total a cobrar")}: {formatCurrency(reportTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Global summary", "Resumen global")}</p>
              <h2 className="panel-title">{t("Registered makes across all locations", "Marcas registradas en todas las ubicaciones")}</h2>
            </div>
            <Badge variant="secondary">{totalVehicles} {t("vehicles", "vehiculos")}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {globalMakes.map((make) => (
              <div key={make} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-stone-300">
                {make} · {vehicles.filter((entry) => entry.make === make).length}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Control", "Control")}</p>
              <h2 className="panel-title">{t("System maintenance", "Mantenimiento del sistema")}</h2>
            </div>
            <TimerReset className="h-5 w-5 text-stone-400" />
          </div>

          <p className="text-sm text-stone-300">
            {t(
              "From this view you can review the whole business and jump into a specific location when needed.",
              "Desde esta vista puedes revisar todo el negocio y saltar a una ubicacion puntual cuando necesites operar."
            )}
          </p>

          <div className="mt-6 border-t border-white/10 pt-6">
            <Button type="button" variant="destructive" onClick={onResetDemoData}>
              <TimerReset className="mr-2 h-4 w-4" />
              {t("Reset demo data", "Reiniciar datos de prueba")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(deleteStoreTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteStoreTarget(null);
            setDeleteStorePin("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
          <DialogHeader>
            <DialogTitle className="text-white">{t("Delete store", "Eliminar store")}</DialogTitle>
            <DialogDescription className="text-stone-400">
              {deleteStoreTarget
                ? t(
                    `Delete ${deleteStoreTarget.name}? Enter the administrator PIN. This only works if it is not active on this computer and has no operational records.`,
                    `Eliminar ${deleteStoreTarget.name}? Ingresa el PIN del administrador. Esto solo funcionara si no esta activa en esta computadora y no tiene registros operativos.`
                  )
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const completed = onDeleteStore(deleteStorePin);
              if (!completed) return;
              setDeleteStorePin("");
            }}
          >
            {deleteStoreFeedback ? (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {deleteStoreFeedback}
              </div>
            ) : null}

            <Field label={t("Administrator PIN", "PIN del administrador")}>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={deleteStorePin}
                onChange={(event) =>
                  setDeleteStorePin(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="1234"
                required
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDeleteStoreTarget(null);
                  setDeleteStoreFeedback(null);
                  setDeleteStorePin("");
                }}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button type="submit" variant="destructive">
                {t("Delete", "Eliminar")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
