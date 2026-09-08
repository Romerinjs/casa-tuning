"use client";

import { useState } from "react";
import { AlertTriangle, EyeOff, FileSignature, X } from "lucide-react";

export interface HideOrderModalOrder {
  id: number;
  code: string;
  car: {
    plate: string;
  };
  signatureUrl: string | null;
}

export interface HideOrderModalProps {
  order: HideOrderModalOrder;
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onRequestSignature: () => void;
  onConfirm: () => void;
}

type ConfirmationStep = "explanation" | "final";

type HideOrderDialogProps = Omit<HideOrderModalProps, "open">;

export function HideOrderModal(props: HideOrderModalProps) {
  if (!props.open) return null;

  return (
    <HideOrderDialog
      key={props.order.id}
      order={props.order}
      pending={props.pending}
      error={props.error}
      onClose={props.onClose}
      onRequestSignature={props.onRequestSignature}
      onConfirm={props.onConfirm}
    />
  );
}

function HideOrderDialog({
  order,
  pending,
  error,
  onClose,
  onRequestSignature,
  onConfirm,
}: HideOrderDialogProps) {
  const [confirmationStep, setConfirmationStep] =
    useState<ConfirmationStep>("explanation");

  const hasSignature = Boolean(order.signatureUrl?.trim());
  const titleId = `hide-order-title-${order.id}`;
  const descriptionId = `hide-order-description-${order.id}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={pending}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-base font-bold text-zinc-900">
                Ocultar orden {order.code}
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                Vehículo {order.car.plate}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={pending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {!hasSignature ? (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <FileSignature className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p id={descriptionId} className="text-sm font-medium leading-6">
                Esta orden aún no tiene firma. Debes registrar la firma para completar esta acción.
              </p>
            </div>
          ) : confirmationStep === "explanation" ? (
            <div id={descriptionId} className="space-y-3 text-sm leading-6 text-zinc-600">
              <p>
                La orden dejará de aparecer en el panel de órdenes y en sus búsquedas habituales.
              </p>
              <p>
                Esta acción no elimina la información de la orden ni sus documentos asociados.
              </p>
            </div>
          ) : (
            <div
              id={descriptionId}
              className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold leading-6">
                Confirma que deseas ocultar esta orden. No podrás restaurarla desde la interfaz.
              </p>
            </div>
          )}

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-5 py-4">
          {hasSignature && confirmationStep === "final" ? (
            <button
              type="button"
              onClick={() => setConfirmationStep("explanation")}
              disabled={pending}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Volver
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          {!hasSignature ? (
            <button
              type="button"
              onClick={onRequestSignature}
              disabled={pending}
              className="h-10 rounded-lg bg-[#C9A84C] px-4 text-sm font-bold text-[#0A0A0C] transition-colors hover:bg-[#b0903c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Firmar ahora
            </button>
          ) : confirmationStep === "explanation" ? (
            <button
              type="button"
              onClick={() => setConfirmationStep("final")}
              disabled={pending}
              className="h-10 rounded-lg bg-[#C9A84C] px-4 text-sm font-bold text-[#0A0A0C] transition-colors hover:bg-[#b0903c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Ocultando orden" : "Ocultar orden"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default HideOrderModal;
