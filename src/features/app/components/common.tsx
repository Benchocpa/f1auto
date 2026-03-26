import type { ReactNode } from "react";
import { CarFront } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";

export const BRAND_LOGO_OPTIONS = [
  { label: "Automatic", value: "" },
  { label: "Acura", value: "acura" },
  { label: "Audi", value: "audi" },
  { label: "BMW", value: "bmw" },
  { label: "Chevrolet", value: "chevrolet" },
  { label: "Ford", value: "ford" },
  { label: "Honda", value: "honda" },
  { label: "Jeep", value: "jeep" },
  { label: "Mercedes", value: "mercedes" },
  { label: "Nissan", value: "nissan" },
  { label: "Porsche", value: "porsche" },
  { label: "Toyota", value: "toyota" },
] as const;

function getBrandTheme(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("porsche")) {
    return {
      monogram: "P",
      eyebrow: "PORSCHE",
      accentClass: "from-amber-300 via-yellow-500 to-orange-500",
      badgeClass: "border-amber-200/30 bg-amber-400/10 text-amber-100",
    };
  }

  if (normalized.includes("mercedes")) {
    return {
      monogram: "M",
      eyebrow: "MERCEDES",
      accentClass: "from-slate-200 via-slate-400 to-slate-600",
      badgeClass: "border-slate-200/30 bg-slate-300/10 text-slate-100",
    };
  }

  if (normalized.includes("audi")) {
    return {
      monogram: "A",
      eyebrow: "AUDI",
      accentClass: "from-rose-300 via-red-500 to-stone-200",
      badgeClass: "border-rose-200/30 bg-rose-400/10 text-rose-100",
    };
  }

  if (normalized.includes("toyota")) {
    return {
      monogram: "T",
      eyebrow: "TOYOTA",
      accentClass: "from-red-300 via-red-500 to-red-700",
      badgeClass: "border-red-200/30 bg-red-500/10 text-red-100",
    };
  }

  if (normalized.includes("nissan")) {
    return {
      monogram: "N",
      eyebrow: "NISSAN",
      accentClass: "from-zinc-200 via-zinc-400 to-zinc-700",
      badgeClass: "border-zinc-200/30 bg-zinc-400/10 text-zinc-100",
    };
  }

  if (normalized.includes("honda")) {
    return {
      monogram: "H",
      eyebrow: "HONDA",
      accentClass: "from-blue-300 via-blue-500 to-indigo-700",
      badgeClass: "border-blue-200/30 bg-blue-500/10 text-blue-100",
    };
  }

  return {
    monogram: "F1",
    eyebrow: "AUTO DETAILS",
    accentClass: "from-amber-300 via-stone-200 to-white",
    badgeClass: "border-white/20 bg-white/10 text-stone-100",
  };
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function HomeCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-70" />
      <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-amber-200/10 bg-amber-300/14 text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        {icon}
      </div>
      <h2 className="text-[30px] font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-stone-300">{description}</p>
      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
        <span className="text-xs uppercase tracking-[0.24em] text-stone-500">
          {disabled ? "Restricted" : "Ready"}
        </span>
        <Button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="rounded-full bg-stone-100 px-5 text-stone-950 shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:bg-white"
        >
          {buttonLabel}
        </Button>
      </div>
    </article>
  );
}

export function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur">
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-amber-200/10 bg-amber-300/14 text-amber-200">
        {icon}
      </div>
      <p className="text-sm text-stone-300">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-3 max-w-[18ch] text-sm leading-6 text-stone-400">{detail}</p>
    </article>
  );
}

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function LocationBrand({
  logoKey = "",
  title,
  subtitle,
  compact = false,
}: {
  logoKey?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const theme = getBrandTheme(title);
  const logoSrc = logoKey ? `/brands/${logoKey}.svg` : null;
  const logoAlt = logoKey ? `${title} logo` : "";

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {logoSrc ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
            <img src={logoSrc} alt={logoAlt} className="h-full w-full scale-[1.22] object-contain" />
          </div>
        ) : (
          <div className={`flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br ${theme.accentClass} text-xl font-semibold text-stone-950 shadow-[0_16px_40px_rgba(0,0,0,0.22)]`}>
            {theme.monogram}
          </div>
        )}
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-stone-500">{theme.eyebrow}</p>
          <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-white">{title}</p>
          {subtitle ? <p className="mt-2 text-sm text-stone-300">{subtitle}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {logoSrc ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white p-2 shadow-lg">
              <img src={logoSrc} alt={logoAlt} className="h-full w-full scale-125 object-contain" />
            </div>
          ) : (
            <div className={`flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br ${theme.accentClass} text-3xl font-semibold text-stone-950 shadow-lg`}>
              {theme.monogram}
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-stone-400">{theme.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-stone-300">{subtitle}</p> : null}
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${theme.badgeClass}`}>
          <CarFront className="h-4 w-4" />
          Brand active
        </div>
      </div>
    </div>
  );
}
