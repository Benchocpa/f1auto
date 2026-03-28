import { Fragment, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
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
import { Textarea } from "../../../components/ui/textarea";
import { createVehicleFilters, createVehicleForm } from "../config";
import type {
  Language,
  StoreName,
  Translate,
  UserEntry,
  VehicleEntry,
  VehicleFiltersState,
  VehicleFormState,
  VehicleStatus,
} from "../types";
import { formatCurrency, formatDateWithWeekday, formatTimestamp, getTodayDate } from "../utils";
import { Field } from "./common";

interface VehicleViewProps {
  activeStore: StoreName;
  areVehicleFiltersVisible: boolean;
  availableMakes: string[];
  availableLocations: string[];
  availableSalesPeople: string[];
  currentUser: UserEntry;
  filteredVehicles: VehicleEntry[];
  language: Language;
  makeFilter: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setAreVehicleFiltersVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMakeFilter: React.Dispatch<React.SetStateAction<string>>;
  setVehicleFilters: React.Dispatch<React.SetStateAction<VehicleFiltersState>>;
  setVehicleForm: React.Dispatch<React.SetStateAction<VehicleFormState>>;
  t: Translate;
  todaySales: number;
  deleteVehicleEntry: (id: string) => boolean;
  updateVehicleDeliveredTime: (id: string, deliveredTime: string) => void;
  updateVehicleEntry: (id: string, payload: VehicleFormState) => boolean;
  updateVehicleStatus: (id: string, status: VehicleStatus) => void;
  vehicleFilters: VehicleFiltersState;
  vehicleForm: VehicleFormState;
  vehicleRecords: VehicleEntry[];
}

export function VehicleView({
  activeStore,
  areVehicleFiltersVisible,
  availableMakes,
  availableLocations,
  availableSalesPeople,
  currentUser,
  filteredVehicles,
  language,
  makeFilter,
  onSubmit,
  setAreVehicleFiltersVisible,
  setMakeFilter,
  setVehicleFilters,
  setVehicleForm,
  t,
  todaySales,
  deleteVehicleEntry,
  updateVehicleDeliveredTime,
  updateVehicleEntry,
  updateVehicleStatus,
  vehicleFilters,
  vehicleForm,
  vehicleRecords,
}: VehicleViewProps) {
  const [statusConfirmation, setStatusConfirmation] = useState<{
    id: string;
    nextStatus: VehicleStatus;
    vehicleLabel: string;
  } | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<VehicleEntry | null>(null);
  const [editingVehicleForm, setEditingVehicleForm] = useState<VehicleFormState | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null);
  const pendingCount = useMemo(
    () => filteredVehicles.filter((entry) => entry.status === "Pendiente").length,
    [filteredVehicles]
  );
  const deliveredCount = useMemo(
    () => filteredVehicles.filter((entry) => entry.status === "Entregado").length,
    [filteredVehicles]
  );
  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [language]
  );
  const makeSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          vehicleRecords
            .map((entry) => entry.make.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        )
      ),
    [vehicleRecords]
  );
  const modelSuggestions = useMemo(() => {
    const normalizedMake = vehicleForm.make.trim().toLowerCase();
    const source = normalizedMake
      ? vehicleRecords.filter((entry) => entry.make.trim().toLowerCase() === normalizedMake)
      : vehicleRecords;

    return Array.from(
      new Set(
        source
          .map((entry) => entry.model.trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
      )
    );
  }, [vehicleForm.make, vehicleRecords]);
  const serviceSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          vehicleRecords
            .map((entry) => entry.simo.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        )
      ),
    [vehicleRecords]
  );
  const overduePendingVehicles = useMemo(
    () =>
      vehicleRecords
        .filter(
          (entry) => entry.status === "Pendiente" && entry.date < getTodayDate()
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [vehicleRecords]
  );
  const buildInvoiceTitle = (entry: VehicleEntry) => `${entry.make} ${entry.model} · ${entry.stock}`;
  const buildInvoiceRows = (entry: VehicleEntry) => [
    [t("Store", "Store"), entry.store],
    [t("Date", "Fecha"), shortDateFormatter.format(new Date(`${entry.date}T00:00:00`))],
    [t("Time", "Hora"), entry.time],
    [t("Stock / Plate", "Stock / Placa"), entry.stock],
    [t("Vehicle", "Vehiculo"), `${entry.make} ${entry.model}`],
    ["VIN", entry.vin || "-"],
    [t("Responsible", "Responsable"), entry.salesPerson],
    [t("Pickup", "Recogida"), entry.pickupTime || "-"],
    [t("Service", "Servicio"), entry.simo || "-"],
    [t("Comments", "Comentarios"), entry.comments || "-"],
    [t("Status", "Estado"), entry.status === "Entregado" ? t("Complete", "Completo") : t("Pending", "Pendiente")],
    [t("Amount due", "Monto a cobrar"), formatCurrency(entry.price)],
  ];

  const handleInvoiceCsvExport = (entry: VehicleEntry) => {
    const rows = buildInvoiceRows(entry);
    const csv = rows.map(([label, value]) => `"${label.replace(/"/g, '""')}","${value.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([`\uFEFFConcept,Value\n${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `billing-${entry.stock.replace(/\s+/g, "-").toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleInvoicePdfExport = (entry: VehicleEntry) => {
    const invoiceWindow = window.open("", "_blank", "width=900,height=700");
    if (!invoiceWindow) return;

    const rows = buildInvoiceRows(entry)
      .map(
        ([label, value]) =>
          `<tr><td style="padding:10px 12px;border-bottom:1px solid #e7e5e4;color:#57534e;font-weight:600;">${label}</td><td style="padding:10px 12px;border-bottom:1px solid #e7e5e4;color:#111827;">${value}</td></tr>`
      )
      .join("");

    invoiceWindow.document.write(`
      <html>
        <head>
          <title>Billing Statement</title>
        </head>
        <body style="font-family:Arial,sans-serif;padding:32px;color:#111827;">
          <div style="max-width:760px;margin:0 auto;">
            <p style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#78716c;">F1 Auto Details</p>
            <h1 style="margin:12px 0 8px;font-size:32px;">${t("Billing statement", "Cuenta de cobro")}</h1>
            <p style="margin:0 0 24px;color:#57534e;">${buildInvoiceTitle(entry)}</p>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
              <tbody>${rows}</tbody>
            </table>
          </div>
        </body>
      </html>
    `);
    invoiceWindow.document.close();
    invoiceWindow.focus();
    invoiceWindow.print();
  };

  const handleInvoiceEmail = (entry: VehicleEntry) => {
    const recipient = window.prompt(
      t("Enter the email address for this billing statement.", "Ingresa el correo para esta cuenta de cobro.")
    );
    if (!recipient) return;

    const subject = encodeURIComponent(`${t("Billing statement", "Cuenta de cobro")} · ${buildInvoiceTitle(entry)}`);
    const body = encodeURIComponent(
      buildInvoiceRows(entry)
        .map(([label, value]) => `${label}: ${value}`)
        .join("\n")
    );
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="space-y-6">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Vehicle intake", "Ingreso de vehiculos")}</p>
            <h2 className="panel-title">
              {t("Fast intake and delivery board", "Captura rapida y panel de entregas")}
            </h2>
          </div>
          <Badge variant="secondary">{activeStore}</Badge>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
              {t("Today sales", "Ventas de hoy")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(todaySales)}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
              {t("Pending", "Pendientes")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">
              {t("Complete", "Completos")}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{deliveredCount}</p>
          </div>
        </div>

        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={onSubmit}>
          <Field label={t("Stock / Plate", "Stock / Placa")}>
            <Input
              value={vehicleForm.stock}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  stock: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              placeholder={t("Internal number or plate", "Numero interno o placa")}
              required
            />
          </Field>

          <Field label={t("Make", "Marca")}>
            <Input
              list="vehicle-make-suggestions"
              value={vehicleForm.make}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  make: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              placeholder={t("Brand", "Marca")}
              required
            />
            <datalist id="vehicle-make-suggestions">
              {makeSuggestions.map((make) => (
                <option key={make} value={make} />
              ))}
            </datalist>
          </Field>

          <Field label={t("Model", "Modelo")}>
            <Input
              list="vehicle-model-suggestions"
              value={vehicleForm.model}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  model: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              placeholder={t("Model", "Modelo")}
              required
            />
            <datalist id="vehicle-model-suggestions">
              {modelSuggestions.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </Field>

          <Field label={t("Responsible", "Responsable")}>
            <Input
              value={vehicleForm.salesPerson}
              readOnly
              className="h-12 rounded-2xl"
              placeholder={t("Logged-in user", "Usuario logueado")}
              required
            />
          </Field>

          <Field label={t("Date", "Fecha")}>
            <Input
              type="date"
              value={vehicleForm.date}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              required
            />
            <p className="text-xs text-stone-400">
              {formatDateWithWeekday(vehicleForm.date, language)}
            </p>
          </Field>

          <Field label={t("Pickup time", "Hora de recogida")}>
            <Input
              type="time"
              value={vehicleForm.pickupTime}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  pickupTime: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
            />
          </Field>

          <Field label={t("Price", "Precio")}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={vehicleForm.price}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              placeholder="0.00"
            />
          </Field>

          <Field label="VIN" className="md:col-span-2 xl:col-span-2">
            <Input
              value={vehicleForm.vin}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  vin: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              placeholder={t("VIN or identifier", "VIN o identificador")}
            />
          </Field>

          <Field
            label={t("Service / SIMO", "SIMO / Servicio")}
            className="md:col-span-2 xl:col-span-2"
          >
            <Input
              list="vehicle-service-suggestions"
              value={vehicleForm.simo}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  simo: event.target.value,
                }))
              }
              className="h-12 rounded-2xl"
              placeholder={t(
                "Service type, package, or SIMO",
                "Tipo de servicio, paquete o SIMO"
              )}
              required
            />
            <datalist id="vehicle-service-suggestions">
              {serviceSuggestions.map((service) => (
                <option key={service} value={service} />
              ))}
            </datalist>
          </Field>

          <Field
            label={t("Comments", "Comentarios")}
            className="md:col-span-2 xl:col-span-4"
          >
            <Textarea
              value={vehicleForm.comments}
              onChange={(event) =>
                setVehicleForm((current) => ({
                  ...current,
                  comments: event.target.value,
                }))
              }
              placeholder={t(
                "Vehicle notes or instructions",
                "Observaciones del vehiculo o instrucciones"
              )}
            />
          </Field>

          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
            <Button type="submit" className="h-12 rounded-2xl px-6 text-base">
              {t("Save vehicle", "Guardar ingreso")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-2xl px-6 text-base"
              onClick={() => setVehicleForm(createVehicleForm(activeStore))}
            >
              {t("Clear form", "Limpiar formulario")}
            </Button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{t("Daily operations", "Operacion diaria")}</p>
            <h2 className="panel-title">
              {t("Vehicle operations board", "Panel operativo de vehiculos")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAreVehicleFiltersVisible((current) => !current)}
            >
              {areVehicleFiltersVisible
                ? t("Hide filters", "Ocultar filtros")
                : t("More filters", "Mas filtros")}
            </Button>
            <Badge variant="secondary">
              {filteredVehicles.length} {t("results", "resultados")}
            </Badge>
          </div>
        </div>

        {overduePendingVehicles.length ? (
          <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">
              {t(
                `${overduePendingVehicles.length} pending vehicles from previous days need review.`,
                `${overduePendingVehicles.length} vehiculos pendientes de dias anteriores necesitan revision.`
              )}
            </p>
            <p className="mt-1 text-amber-50/85">
              {overduePendingVehicles
                .slice(0, 4)
                .map((entry) => `${entry.make} ${entry.model} · ${entry.stock} · ${entry.date}`)
                .join(" · ")}
              {overduePendingVehicles.length > 4 ? " ..." : ""}
            </p>
          </div>
        ) : null}

        {areVehicleFiltersVisible ? (
          <>
            <div
              className={`mb-4 grid gap-3 ${
                currentUser.role === "admin"
                  ? "lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]"
                  : "lg:grid-cols-[1.2fr_0.8fr_0.8fr]"
              }`}
            >
              <Field label={t("Search", "Busqueda")}>
                <Input
                  value={vehicleFilters.search}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl"
                  placeholder={t(
                    "Stock, VIN, make, model, sales person...",
                    "Stock, VIN, marca, modelo, responsable..."
                  )}
                />
              </Field>

              <Field label={t("Status", "Estado")}>
                <Select
                  value={vehicleFilters.status}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      status: event.target.value as VehicleFiltersState["status"],
                    }))
                  }
                  className="h-12 rounded-2xl"
                >
                  <option value="all">{t("All statuses", "Todos los estados")}</option>
                  <option value="Pendiente">{t("Pending", "Pendiente")}</option>
                  <option value="Entregado">{t("Complete", "Completo")}</option>
                </Select>
              </Field>

              <Field label={t("Date", "Fecha")}>
                <Select
                  value={vehicleFilters.datePreset}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      datePreset: event.target.value as VehicleFiltersState["datePreset"],
                      date:
                        event.target.value === "specific"
                          ? current.date || new Date().toISOString().slice(0, 10)
                          : current.date,
                    }))
                  }
                  className="h-12 rounded-2xl"
                >
                  <option value="today">{t("Today", "Hoy")}</option>
                  <option value="yesterday">{t("Yesterday", "Ayer")}</option>
                  <option value="week">{t("This week", "Esta semana")}</option>
                  <option value="month">{t("This month", "Este mes")}</option>
                  <option value="specific">{t("Specific day", "Dia especifico")}</option>
                </Select>
              </Field>

              {currentUser.role === "admin" ? (
                <Field label={t("Location", "Ubicacion")}>
                  <Select
                    value={vehicleFilters.store}
                    onChange={(event) =>
                      setVehicleFilters((current) => ({
                        ...current,
                        store: event.target.value as VehicleFiltersState["store"],
                      }))
                    }
                    className="h-12 rounded-2xl"
                  >
                    <option value="all">{t("All locations", "Todas las ubicaciones")}</option>
                    {availableLocations.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
            </div>

            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-200">
                {t("Advanced filters", "Filtros avanzados")}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setVehicleFilters(createVehicleFilters());
                  setMakeFilter("Todas");
                }}
              >
                {t("Reset filters", "Reiniciar filtros")}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vehicleFilters.datePreset === "specific" ? (
                <Field label={t("Specific date", "Fecha especifica")}>
                  <Input
                    type="date"
                    value={vehicleFilters.date || new Date().toISOString().slice(0, 10)}
                    onChange={(event) =>
                      setVehicleFilters((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="h-12 rounded-2xl"
                  />
                </Field>
              ) : null}

              <Field label={t("Make", "Marca")}>
                <Select value={makeFilter} onChange={(event) => setMakeFilter(event.target.value)}>
                  <option value="Todas">{t("All makes", "Todas las marcas")}</option>
                  {availableMakes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t("Sales person", "Responsable")}>
                <Select
                  value={vehicleFilters.salesPerson || "all"}
                  onChange={(event) =>
                    setVehicleFilters((current) => ({
                      ...current,
                      salesPerson: event.target.value === "all" ? "" : event.target.value,
                    }))
                  }
                >
                  <option value="all">{t("All sales people", "Todos los responsables")}</option>
                  {availableSalesPeople.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </Select>
              </Field>

            </div>
            </div>
          </>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("Date", "Fecha")}</TableHead>
              <TableHead>{t("Stock", "Stock")}</TableHead>
              <TableHead>{t("Location", "Ubicacion")}</TableHead>
              <TableHead>{t("Vehicle", "Vehiculo")}</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>{t("Responsible", "Responsable")}</TableHead>
              <TableHead>{t("Comments", "Comentarios")}</TableHead>
              <TableHead>{t("Pickup", "Recogida")}</TableHead>
              <TableHead>{t("Service", "Servicio")}</TableHead>
              <TableHead>{t("Price", "Precio")}</TableHead>
              <TableHead>{t("Status", "Estado")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length ? (
              filteredVehicles.map((entry) => (
                <Fragment key={entry.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedVehicleId((current) => (current === entry.id ? null : entry.id))
                    }
                  >
                    <TableCell>
                      <div>{shortDateFormatter.format(new Date(`${entry.date}T00:00:00`))}</div>
                      <div className="text-xs text-stone-400">{entry.time}</div>
                    </TableCell>
                    <TableCell className="font-medium">{entry.stock}</TableCell>
                    <TableCell>{entry.store}</TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{`${entry.make} ${entry.model}`}</div>
                    </TableCell>
                    <TableCell>{entry.vin || "-"}</TableCell>
                    <TableCell>{entry.salesPerson}</TableCell>
                    <TableCell className="max-w-[260px]">
                      <div className="truncate">{entry.comments || "-"}</div>
                    </TableCell>
                    <TableCell>{entry.pickupTime || "-"}</TableCell>
                    <TableCell>{entry.simo || "-"}</TableCell>
                    <TableCell>{formatCurrency(entry.price)}</TableCell>
                    <TableCell>
                      {entry.status === "Entregado" ? (
                        <Button
                          type="button"
                          className="min-w-[130px] cursor-default rounded-2xl bg-emerald-100 text-emerald-900 hover:bg-emerald-100"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          {t("Complete", "Completo")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className="min-w-[130px] rounded-2xl bg-amber-100 text-amber-900 hover:bg-amber-200"
                          onClick={(event) => {
                            event.stopPropagation();
                            setStatusConfirmation({
                              id: entry.id,
                              nextStatus: "Entregado",
                              vehicleLabel: `${entry.make} ${entry.model} · ${entry.stock}`,
                            });
                          }}
                        >
                          {t("Pending", "Pendiente")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedVehicleId === entry.id ? (
                    <TableRow className="bg-white/[0.03] hover:bg-white/[0.03]">
                      <TableCell colSpan={11} className="px-4 py-4">
                        <div className="flex flex-wrap gap-3">
                          {entry.status !== "Entregado" ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="rounded-full"
                              onClick={() => {
                                setEditingVehicle(entry);
                                setEditingVehicleForm({
                                  store: entry.store,
                                  date: entry.date,
                                  stock: entry.stock,
                                  make: entry.make,
                                  model: entry.model,
                                  vin: entry.vin,
                                  salesPerson: entry.salesPerson,
                                  time: entry.time,
                                  pickupTime: entry.pickupTime,
                                  simo: entry.simo,
                                  comments: entry.comments,
                                  price: String(entry.price),
                                });
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("Edit", "Editar")}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="rounded-full"
                            onClick={() => {
                              if (!window.confirm(t("Delete this vehicle?", "Eliminar este vehiculo?"))) return;
                              deleteVehicleEntry(entry.id);
                              setExpandedVehicleId(null);
                              setDetailVehicleId(null);
                            }}
                          >
                            {t("Delete", "Eliminar")}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={() =>
                              setDetailVehicleId((current) => (current === entry.id ? null : entry.id))
                            }
                          >
                            {t("Detail", "Detalle")}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleInvoiceEmail(entry)}
                          >
                            {t("Email bill", "Enviar cobro")}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleInvoicePdfExport(entry)}
                          >
                            {t("Download PDF", "Descargar PDF")}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleInvoiceCsvExport(entry)}
                          >
                            {t("Download Excel", "Descargar Excel")}
                          </Button>
                        </div>

                        {detailVehicleId === entry.id ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">VIN</p>
                              <p className="mt-2 text-sm text-stone-100">{entry.vin || "-"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                                {t("Service", "Servicio")}
                              </p>
                              <p className="mt-2 text-sm text-stone-100">{entry.simo || "-"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                                {t("Actual delivery", "Entrega real")}
                              </p>
                              <p className="mt-2 text-sm text-stone-100">{entry.deliveredTime || "-"}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 md:col-span-3">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                                {t("Comments", "Comentarios")}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-stone-100">{entry.comments || "-"}</p>
                            </div>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-stone-400">
                  {t(
                    "No vehicles match the selected filters.",
                    "No hay vehiculos que coincidan con los filtros seleccionados."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog
          open={Boolean(statusConfirmation)}
          onOpenChange={(open) => {
            if (!open) {
              setStatusConfirmation(null);
            }
          }}
        >
          <DialogContent className="max-w-md rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
            <DialogHeader>
              <DialogTitle className="text-white">
                {t("Confirm completion", "Confirmar completado")}
              </DialogTitle>
              <DialogDescription className="text-stone-400">
                {statusConfirmation
                  ? t(
                      `Confirm that ${statusConfirmation.vehicleLabel} was completed.`,
                      `Confirma que ${statusConfirmation.vehicleLabel} fue completado.`
                    )
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStatusConfirmation(null)}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button
                type="button"
                className="bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                onClick={() => {
                  if (!statusConfirmation) return;
                  updateVehicleStatus(statusConfirmation.id, statusConfirmation.nextStatus);
                  setStatusConfirmation(null);
                }}
              >
                {t("Confirm completion", "Confirmar completado")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(editingVehicle && editingVehicleForm)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingVehicle(null);
              setEditingVehicleForm(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl rounded-3xl border-white/10 bg-stone-950 p-6 text-stone-100">
            <DialogHeader>
              <DialogTitle className="text-white">{t("Edit vehicle", "Editar vehiculo")}</DialogTitle>
              <DialogDescription className="text-stone-400">
                {t(
                  "Correct any field and save the changes for this vehicle.",
                  "Corrige cualquier dato y guarda los cambios de este vehiculo."
                )}
              </DialogDescription>
            </DialogHeader>

            {editingVehicleForm ? (
              <form
                className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!editingVehicle || !editingVehicleForm) return;
                  const saved = updateVehicleEntry(editingVehicle.id, editingVehicleForm);
                  if (!saved) return;
                  setEditingVehicle(null);
                  setEditingVehicleForm(null);
                }}
              >
                <Field label={t("Stock / Plate", "Stock / Placa")}>
                  <Input
                    value={editingVehicleForm.stock}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, stock: event.target.value } : current
                      )
                    }
                    required
                  />
                </Field>

                <Field label={t("Make", "Marca")}>
                  <Input
                    value={editingVehicleForm.make}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, make: event.target.value } : current
                      )
                    }
                    required
                  />
                </Field>

                <Field label={t("Model", "Modelo")}>
                  <Input
                    value={editingVehicleForm.model}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, model: event.target.value } : current
                      )
                    }
                    required
                  />
                </Field>

                <Field label={t("Date", "Fecha")}>
                  <Input
                    type="date"
                    value={editingVehicleForm.date}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, date: event.target.value } : current
                      )
                    }
                    required
                  />
                </Field>

                <Field label="VIN">
                  <Input
                    value={editingVehicleForm.vin}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, vin: event.target.value } : current
                      )
                    }
                  />
                </Field>

                <Field label={t("Pickup time", "Hora de recogida")}>
                  <Input
                    type="time"
                    value={editingVehicleForm.pickupTime}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, pickupTime: event.target.value } : current
                      )
                    }
                  />
                </Field>

                <Field label={t("Price", "Precio")}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingVehicleForm.price}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, price: event.target.value } : current
                      )
                    }
                  />
                </Field>

                <Field label={t("Service / SIMO", "SIMO / Servicio")}>
                  <Input
                    value={editingVehicleForm.simo}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, simo: event.target.value } : current
                      )
                    }
                    required
                  />
                </Field>

                <Field label={t("Comments", "Comentarios")} className="md:col-span-2 xl:col-span-4">
                  <Textarea
                    value={editingVehicleForm.comments}
                    onChange={(event) =>
                      setEditingVehicleForm((current) =>
                        current ? { ...current, comments: event.target.value } : current
                      )
                    }
                  />
                </Field>

                <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditingVehicle(null);
                      setEditingVehicleForm(null);
                    }}
                  >
                    {t("Cancel", "Cancelar")}
                  </Button>
                  <Button type="submit">{t("Save changes", "Guardar cambios")}</Button>
                </div>
              </form>
            ) : null}
          </DialogContent>
        </Dialog>

        <div className="mt-6 border-t border-white/10 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{t("Vehicle history", "Historial de vehiculos")}</p>
              <h3 className="text-xl font-semibold text-white">
                {t("Recent activity timeline", "Linea de tiempo reciente")}
              </h3>
            </div>
            <Badge variant="secondary">{filteredVehicles.length}</Badge>
          </div>

          <div className="space-y-4">
            {filteredVehicles.length ? (
              filteredVehicles.slice(0, 8).map((entry) => (
                <article
                  key={`history-${entry.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {entry.make} {entry.model}
                      </p>
                      <p className="text-sm text-stone-300">
                        {entry.store} · {entry.stock} · {entry.salesPerson}
                      </p>
                    </div>
                    <div className="text-sm text-stone-300">
                      {t("Last update", "Ultima actualizacion")}:{" "}
                      {formatTimestamp(entry.updatedAt, language)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-stone-300 md:grid-cols-2 xl:grid-cols-4">
                    <span>
                      {t("Status", "Estado")}:{" "}
                      {entry.status === "Entregado"
                        ? t("Complete", "Completo")
                        : t("Pending", "Pendiente")}
                    </span>
                    <span>{t("Pickup target", "Recogida estimada")}: {entry.pickupTime || "-"}</span>
                    <span>{t("Actual delivery", "Entrega real")}: {entry.deliveredTime || "-"}</span>
                    <span>{t("Updated by", "Actualizado por")}: {entry.updatedBy}</span>
                  </div>

                  {entry.comments || entry.simo ? (
                    <div className="mt-4 grid gap-2 text-sm text-stone-400 md:grid-cols-2">
                      <span>{t("Service", "Servicio")}: {entry.simo || "-"}</span>
                      <span>{t("Comments", "Comentarios")}: {entry.comments || "-"}</span>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                    {entry.history.slice(0, 4).map((eventItem) => (
                      <div
                        key={eventItem.id}
                        className="rounded-xl border border-white/10 bg-stone-900/60 px-3 py-2 text-sm text-stone-300"
                      >
                        <span className="font-medium text-white">{eventItem.note}</span>
                        <span className="ml-2 text-stone-400">
                          {formatTimestamp(eventItem.timestamp, language)} · {eventItem.by}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                {t(
                  "No recent vehicle history is available for these filters.",
                  "No hay historial reciente de vehiculos para estos filtros."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
