import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import type {
  AdminStoreStat,
  DeviceStoreSettings,
  Language,
  SalesPeriodPreset,
  StoreEntry,
  StoreFormState,
  StoreName,
  Translate,
  VehicleEntry,
} from "../types";
import { formatCurrency } from "../utils";
import { BRAND_LOGO_OPTIONS, LocationBrand, MiniStat, Field } from "./common";

interface AdminViewProps {
  adminStoreStats: AdminStoreStat[];
  deleteStoreFeedback: string | null;
  deleteStoreTarget: StoreEntry | null;
  language: Language;
  onDeleteStore: (adminPin: string) => boolean;
  onExportDailyBillingCsv: (store: StoreName, vehicles: VehicleEntry[]) => void;
  onJumpToStore: (store: StoreName) => void;
  onPrintDailyBilling: (store: StoreName, vehicles: VehicleEntry[]) => void;
  onSendReportPreview: (store: StoreName, vehicles: VehicleEntry[]) => void;
  onSalesCustomEndChange: React.Dispatch<React.SetStateAction<string>>;
  onSalesCustomStartChange: React.Dispatch<React.SetStateAction<string>>;
  onSalesPeriodChange: React.Dispatch<React.SetStateAction<SalesPeriodPreset>>;
  onStoreSettingsOpenChange: (open: boolean) => void;
  onSetDefaultStore: (store: StoreName) => void;
  onStoreSettingsSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStoreSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  salesCustomEnd: string;
  salesCustomStart: string;
  salesPeriod: SalesPeriodPreset;
  salesPeriodLabel: string;
  setDeleteStoreFeedback: React.Dispatch<React.SetStateAction<string | null>>;
  setDeleteStoreTarget: React.Dispatch<React.SetStateAction<StoreEntry | null>>;
  setEditingStoreId: React.Dispatch<React.SetStateAction<string | null>>;
  setStoreSettingsForm: React.Dispatch<React.SetStateAction<DeviceStoreSettings>>;
  setStoreForm: React.Dispatch<React.SetStateAction<StoreFormState>>;
  storeReportMap: Map<StoreName, VehicleEntry[]>;
  storeSettings: DeviceStoreSettings;
  storeSettingsForm: DeviceStoreSettings;
  stores: StoreEntry[];
  storeForm: StoreFormState;
  t: Translate;
  isStoreSettingsOpen: boolean;
  isStoreModalOpen: boolean;
  editingStoreId: string | null;
  setIsStoreModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AdminView({
  adminStoreStats,
  deleteStoreFeedback,
  deleteStoreTarget,
  editingStoreId,
  isStoreModalOpen,
  isStoreSettingsOpen,
  language,
  onDeleteStore,
  onExportDailyBillingCsv,
  onJumpToStore,
  onPrintDailyBilling,
  onSendReportPreview,
  onSalesCustomEndChange,
  onSalesCustomStartChange,
  onSalesPeriodChange,
  onStoreSettingsOpenChange,
  onSetDefaultStore,
  onStoreSettingsSubmit,
  onStoreSubmit,
  salesCustomEnd,
  salesCustomStart,
  salesPeriod,
  salesPeriodLabel,
  setDeleteStoreFeedback,
  setDeleteStoreTarget,
  setEditingStoreId,
  setIsStoreModalOpen,
  setStoreSettingsForm,
  setStoreForm,
  storeReportMap,
  storeSettings,
  storeSettingsForm,
  storeForm,
  stores,
  t,
}: AdminViewProps) {
  const [deleteStorePin, setDeleteStorePin] = useState("");
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [expandedBillingStoreId, setExpandedBillingStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!deleteStoreTarget) {
      setDeleteStorePin("");
      setDeleteStoreFeedback(null);
    }
  }, [deleteStoreTarget, setDeleteStoreFeedback]);

  const getStoreStats = (storeName: StoreName) =>
    adminStoreStats.find((item) => item.store === storeName) ?? {
      store: storeName,
      vehicles: 0,
      employees: 0,
      openShifts: 0,
      pending: 0,
      salesToday: 0,
    };

  return (
    <section className="space-y-6">
      <div className="panel">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Field label={t("Sales period", "Periodo de ventas")}>
            <Select value={salesPeriod} onChange={(event) => onSalesPeriodChange(event.target.value as SalesPeriodPreset)}>
              <option value="today">{t("Today", "Hoy")}</option>
              <option value="yesterday">{t("Yesterday", "Ayer")}</option>
              <option value="week">{t("This week", "Esta semana")}</option>
              <option value="month">{t("This month", "Este mes")}</option>
              <option value="year">{t("This year", "Este ano")}</option>
              <option value="custom">{t("Custom range", "Rango personalizado")}</option>
            </Select>
          </Field>

          {salesPeriod === "custom" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("From", "Desde")}>
                <Input type="date" value={salesCustomStart} onChange={(event) => onSalesCustomStartChange(event.target.value)} />
              </Field>
              <Field label={t("To", "Hasta")}>
                <Input type="date" value={salesCustomEnd} onChange={(event) => onSalesCustomEndChange(event.target.value)} />
              </Field>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-300">
              {t("Viewing sales for", "Viendo ventas de")}: {salesPeriodLabel}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel xl:col-span-2">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t("Stores", "Stores")}</p>
              <h2 className="panel-title">{t("Store directory", "Directorio de stores")}</h2>
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
              stores.map((entry) => {
                const storeStats = getStoreStats(entry.name);
                const storeReportVehicles = storeReportMap.get(entry.name) ?? [];
                const storeReportCompleted = storeReportVehicles.filter((item) => item.status === "Entregado").length;
                const storeReportTotal = storeReportVehicles.reduce((sum, item) => sum + item.price, 0);

                return (
                <div key={entry.id} className="overflow-hidden rounded-2xl border border-white/10 bg-stone-900/70">
                  <button
                    type="button"
                    className="w-full px-4 py-4 text-left transition hover:bg-white/[0.03]"
                    onClick={() =>
                      setExpandedStoreId((current) => (current === entry.id ? null : entry.id))
                    }
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                        <LocationBrand
                          title={entry.name}
                          subtitle={[entry.address, entry.phone].filter(Boolean).join(" · ") || t("No contact details yet.", "Aun sin datos de contacto.")}
                          logoKey={entry.logoKey}
                          compact
                        />
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <MiniStat label={t("Vehicles", "Vehiculos")} value={String(storeStats.vehicles)} />
                          <MiniStat label={t("Pending", "Pendientes")} value={String(storeStats.pending)} />
                          <MiniStat label={t("Open shifts", "Turnos abiertos")} value={String(storeStats.openShifts)} />
                          <MiniStat label={t("Total sales", "Ventas totales")} value={formatCurrency(storeStats.salesToday)} />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {storeSettings.store === entry.name ? (
                            <Badge variant="secondary" className="border-emerald-400/20 bg-emerald-500/15 text-emerald-100">
                              {t("Default on this computer", "Predeterminada en esta computadora")}
                            </Badge>
                          ) : null}
                          <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                            {expandedStoreId === entry.id ? t("Hide actions", "Ocultar acciones") : t("View actions", "Ver acciones")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {expandedStoreId === entry.id ? (
                    <div className="border-t border-white/10 px-4 py-4">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onJumpToStore(entry.name)}
                          >
                            {t("View details", "Ver detalle")}
                          </Button>
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
                            variant="secondary"
                            size="sm"
                            onClick={() => onSetDefaultStore(entry.name)}
                          >
                            {t("Set as default", "Predeterminar")}
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

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{t("Billing report", "Reporte de cobro")}</p>
                              <h3 className="mt-2 text-lg font-semibold text-white">
                                {t("Billing for selected period", "Cobro del periodo seleccionado")} · {entry.name}
                              </h3>
                            </div>
                            <Badge variant="secondary">{salesPeriodLabel}</Badge>
                          </div>

                          <div className="mb-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                            <Field label={t("Billing period", "Periodo del cobro")}>
                              <Select value={salesPeriod} onChange={(event) => onSalesPeriodChange(event.target.value as SalesPeriodPreset)}>
                                <option value="today">{t("Today", "Hoy")}</option>
                                <option value="yesterday">{t("Yesterday", "Ayer")}</option>
                                <option value="week">{t("This week", "Esta semana")}</option>
                                <option value="month">{t("This month", "Este mes")}</option>
                                <option value="year">{t("This year", "Este ano")}</option>
                                <option value="custom">{t("Custom range", "Rango personalizado")}</option>
                              </Select>
                            </Field>

                            {salesPeriod === "custom" ? (
                              <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={t("From", "Desde")}>
                                  <Input type="date" value={salesCustomStart} onChange={(event) => onSalesCustomStartChange(event.target.value)} />
                                </Field>
                                <Field label={t("To", "Hasta")}>
                                  <Input type="date" value={salesCustomEnd} onChange={(event) => onSalesCustomEndChange(event.target.value)} />
                                </Field>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-white/10 bg-stone-900/80 px-4 py-3 text-sm text-stone-300">
                                {t("Preparing billing for", "Preparando cobro para")}: {salesPeriodLabel}
                              </div>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MiniStat label={t("Vehicles in period", "Vehiculos del periodo")} value={String(storeReportVehicles.length)} />
                            <MiniStat label={t("Completed", "Terminados")} value={String(storeReportCompleted)} />
                            <MiniStat label={t("Pending", "Pendientes")} value={String(storeReportVehicles.length - storeReportCompleted)} />
                            <MiniStat label={t("Total sales", "Total vendido")} value={formatCurrency(storeReportTotal)} />
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setExpandedBillingStoreId((current) =>
                                  current === entry.id ? null : entry.id
                                )
                              }
                            >
                              {expandedBillingStoreId === entry.id
                                ? t("Hide billing detail", "Ocultar detalle del cobro")
                                : t("View billed vehicles", "Ver vehiculos cobrados")}
                            </Button>
                            <Button type="button" size="sm" onClick={() => onSendReportPreview(entry.name, storeReportVehicles)}>
                              {t("Send billing", "Enviar cobro")}
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => onPrintDailyBilling(entry.name, storeReportVehicles)}>
                              {t("Download PDF", "Descargar PDF")}
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => onExportDailyBillingCsv(entry.name, storeReportVehicles)}>
                              {t("Download Excel", "Descargar Excel")}
                            </Button>
                          </div>

                          {expandedBillingStoreId === entry.id ? (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-stone-950/50 p-4">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
                                    {t("Billing detail", "Detalle del cobro")}
                                  </p>
                                  <h4 className="mt-2 text-base font-semibold text-white">
                                    {t("Vehicles included in this billing", "Vehiculos incluidos en este cobro")}
                                  </h4>
                                </div>
                                <Badge variant="secondary">
                                  {storeReportVehicles.length} {t("vehicles", "vehiculos")}
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                {storeReportVehicles.length ? (
                                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                    <Table className="min-w-[980px]">
                                      <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                          <TableHead>{t("Stock", "Stock")}</TableHead>
                                          <TableHead>{t("Make", "Marca")}</TableHead>
                                          <TableHead>{t("Model", "Modelo")}</TableHead>
                                          <TableHead>{t("VIN", "VIN")}</TableHead>
                                          <TableHead>{t("Sales person", "Vendedor")}</TableHead>
                                          <TableHead>{t("Time", "Hora")}</TableHead>
                                          <TableHead>{t("SIMO", "SIMO")}</TableHead>
                                          <TableHead>{t("Comments", "Comentarios")}</TableHead>
                                          <TableHead className="text-right">{t("Price", "Precio")}</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {storeReportVehicles.map((vehicle) => (
                                          <TableRow key={vehicle.id}>
                                            <TableCell className="font-medium text-white">{vehicle.stock}</TableCell>
                                            <TableCell>{vehicle.make}</TableCell>
                                            <TableCell>{vehicle.model}</TableCell>
                                            <TableCell>{vehicle.vin || "-"}</TableCell>
                                            <TableCell>{vehicle.salesPerson}</TableCell>
                                            <TableCell>{vehicle.time || "-"}</TableCell>
                                            <TableCell>{vehicle.simo || "-"}</TableCell>
                                            <TableCell className="max-w-[320px] truncate text-stone-300">
                                              {vehicle.comments || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-white">
                                              {formatCurrency(vehicle.price)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                                    {t(
                                      "There are no vehicles in this billing period for this store.",
                                      "No hay vehiculos en este periodo de cobro para esta store."
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                {t("Total amount due", "Monto total a cobrar")}: {formatCurrency(storeReportTotal)}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )})
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                {t("There are no stores yet. Create the first one here.", "Aun no hay stores. Crea la primera aqui.")}
              </div>
            )}
          </div>
        </div>

        <Dialog open={isStoreSettingsOpen} onOpenChange={onStoreSettingsOpenChange}>
          <DialogContent className="max-w-2xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
            <DialogHeader>
              <DialogTitle className="text-white">{t("Configure this computer", "Configurar esta computadora")}</DialogTitle>
              <DialogDescription className="text-stone-400">
                {t(
                  "Choose which store will remain as the default on this computer.",
                  "Elige cual store quedara como predeterminada en esta computadora."
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
