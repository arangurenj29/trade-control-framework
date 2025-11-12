"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TradeListItem, TradesPagination } from "@/lib/dto";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function TradesTable({
  trades,
  pagination
}: {
  trades: TradeListItem[];
  pagination: TradesPagination;
}) {
  const totalLabel =
    pagination.total === 0
      ? "sin registros"
      : `${pagination.total} cierre${pagination.total === 1 ? "" : "s"}`;
  const pageCount = trades.length;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-semibold">Historial reciente</h2>
        <span className="text-sm text-muted-foreground">
          Total sincronizado: <span className="font-medium text-foreground">{totalLabel}</span> · En página:{" "}
          <span className="font-medium text-foreground">{pageCount}</span>
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <TradeTable trades={trades} pagination={pagination} />
        <PaginationControls
          pagination={pagination}
          pageItemCount={pageCount}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </section>
  );
}

function TradeTable({
  trades,
  pagination
}: {
  trades: TradeListItem[];
  pagination: TradesPagination;
}) {
  const { page, pageSize, total } = pagination;
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : (currentPage - 1) * pageSize + trades.length;
  const hasRows = trades.length > 0;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[220px]">Contrato</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Entrada</TableHead>
          <TableHead className="text-right">Salida</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">PnL</TableHead>
          <TableHead>Resultado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
              Aún no hay cierres registrados.
            </TableCell>
          </TableRow>
        ) : (
          trades.map((trade) => {
            const side = String(trade.side ?? "").toLowerCase();
            const tradeType = side === "short" ? "Close Short" : "Close Long";
            const tradeTypeClass = side === "short" ? "text-rose-400" : "text-emerald-400";
            const resultMeta = getResultMeta(trade.pnl_monetario);
            return (
              <TableRow key={trade.id} className="group transition-colors hover:bg-muted/40">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <AssetAvatar symbol={trade.symbol} />
                    <div className="space-y-1">
                      <div className="text-sm font-semibold uppercase tracking-wide text-foreground">
                        {trade.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cerrado: {formatDateTime(trade.close_time)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Abierto: {formatDateTime(trade.open_time)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatQuantity(trade.quantity)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatPrice(trade.entry)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPrice(trade.exit_price)}</TableCell>
                <TableCell className={cn("text-sm font-medium", tradeTypeClass)}>{tradeType}</TableCell>
                <TableCell
                  className={cn(
                    "text-right text-sm font-semibold leading-tight tabular-nums",
                    getPnLClass(trade.pnl_monetario)
                  )}
                >
                  {formatPnLUsd(trade.pnl_monetario)}
                  <div className="text-xs font-normal text-muted-foreground">
                    {formatPnL(trade.pnl_r)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border-transparent px-2 py-1", resultMeta.className)}>
                    {resultMeta.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
      <TableCaption>
        {total === 0
          ? "* No hay cierres registrados todavía."
          : hasRows
            ? `* Página ${currentPage} de ${totalPages}. Mostrando ${start}-${end} de ${total} cierres.`
            : "* La página seleccionada no contiene registros."}
      </TableCaption>
    </Table>
  );
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: Math.abs(value) >= 100 ? 2 : 4,
    maximumFractionDigits: Math.abs(value) >= 100 ? 2 : 6
  }).format(value);
}

function formatPnL(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  if (value === 0) return "0.00 R";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)} R`;
}

function formatPnLUsd(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  if (value === 0) return "$0.00";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always"
  }).format(value);
}

function getPnLClass(value: number | null) {
  if (value === null || Number.isNaN(value)) return "text-muted-foreground";
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-rose-500";
  return "text-foreground";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return format(new Date(value), "d MMM yyyy, HH:mm", { locale: es });
  } catch {
    return "—";
  }
}

function formatQuantity(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: Math.abs(value) < 1 ? 4 : 2,
    maximumFractionDigits: 4,
    signDisplay: "exceptZero"
  }).format(value);
}

function getResultMeta(pnl: number | null) {
  if (pnl === null || Number.isNaN(pnl)) {
    return {
      label: "Pendiente",
      className: "bg-muted text-muted-foreground"
    };
  }

  if (pnl > 0) {
    return {
      label: "Win",
      className: "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30"
    };
  }

  if (pnl < 0) {
    return {
      label: "Loss",
      className: "bg-rose-500/15 text-rose-500 ring-1 ring-rose-500/30"
    };
  }

  return {
    label: "Even",
    className: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30"
  };
}

function AssetAvatar({ symbol }: { symbol: string }) {
  const base = symbol?.split("-")[0] ?? symbol;
  const initials =
    base.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || base.toUpperCase().slice(0, 3);
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase tracking-wide text-foreground ring-1 ring-border/60">
      {initials}
    </span>
  );
}

function PaginationControls({
  pagination,
  pageItemCount,
  pageSizeOptions
}: {
  pagination: TradesPagination;
  pageItemCount: number;
  pageSizeOptions: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const currentPage = Math.min(pagination.page, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const start =
    pagination.total === 0 ? 0 : (currentPage - 1) * pagination.pageSize + 1;
  const end =
    pagination.total === 0
      ? 0
      : (currentPage - 1) * pagination.pageSize + pageItemCount;
  const hasRows = pageItemCount > 0 && pagination.total > 0;

  const changePage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());
    if (clamped <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(clamped));
    }

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false
    });
  };

  const changePageSize = (nextSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = Number.isFinite(nextSize) && nextSize > 0 ? Math.floor(nextSize) : pagination.pageSize;
    params.set("pageSize", String(normalized));
    params.delete("page");

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false
    });
  };

  return (
    <div className="flex flex-col gap-3 border-t bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        {pagination.total === 0
          ? "Sin registros para mostrar."
          : hasRows
            ? `Mostrando ${start}-${end} de ${pagination.total} trades.`
            : "La página seleccionada no contiene registros."}
      </p>
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => changePage(currentPage - 1)}
            disabled={!hasPrev}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => changePage(currentPage + 1)}
            disabled={!hasNext}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <PageSizeSelect
          current={pagination.pageSize}
          options={pageSizeOptions}
          total={pagination.total}
          onChange={changePageSize}
        />
      </div>
    </div>
  );
}

function PageSizeSelect({
  current,
  options,
  total,
  onChange
}: {
  current: number;
  options: number[];
  total: number;
  onChange: (size: number) => void;
}) {
  const normalizedOptions = Array.from(
    new Set([
      current,
      ...options,
      ...(total > 0 && !options.includes(total) ? [total] : [])
    ])
  )
    .filter((size) => size > 0)
    .sort((a, b) => a - b)
    .slice(0, 6);

  const isCustom = !normalizedOptions.includes(current);

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      Mostrar
      <select
        value={isCustom ? "custom" : current}
        onChange={(event) => {
          const value = event.target.value;
          if (value === "custom") return;
          onChange(Number(value));
        }}
        className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {normalizedOptions.map((size) => {
          const label =
            total > 0 && size === total ? "Todos" : `${size} por página`;
          return (
            <option key={size} value={size}>
              {label}
            </option>
          );
        })}
        {isCustom ? (
          <option value="custom">{`${current} por página`}</option>
        ) : null}
      </select>
    </label>
  );
}
