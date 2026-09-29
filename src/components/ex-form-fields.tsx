import type { ReactNode } from "react";

// Estilos compartilhados pelos formulários do módulo de Inspeção Ex.
export const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export function ModalShell({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-lg ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function FormActions({
  loading,
  error,
  onClose,
  submitLabel = "Salvar",
}: {
  loading: boolean;
  error: string | null;
  onClose: () => void;
  submitLabel?: string;
}) {
  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Salvando..." : submitLabel}
        </button>
      </div>
    </>
  );
}

/** Envia o formulário para a API e devolve a mensagem de erro, se houver. */
export async function submitJson(
  url: string,
  method: "POST" | "PATCH",
  payload: unknown,
  fallbackError: string,
): Promise<{ error: string | null; data: unknown }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: (data as { error?: string }).error ?? fallbackError, data };
  }
  return { error: null, data };
}
