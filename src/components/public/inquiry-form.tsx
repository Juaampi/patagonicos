"use client";

import { useActionState } from "react";
import { createInquiryAction, type InquiryActionState } from "@/actions/public";

const initialState: InquiryActionState = {};

type InquiryFormProps = {
  propertyId?: string;
  propertyTitle?: string;
};

export function InquiryForm({ propertyId, propertyTitle }: InquiryFormProps) {
  const [state, action, pending] = useActionState(createInquiryAction, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <input type="hidden" name="propertyId" value={propertyId || ""} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-gold">Consulta directa</p>
        <h3 className="font-serif text-3xl text-ivory">
          {propertyTitle ? `Consultá por ${propertyTitle}` : "Hablemos de tu próxima propiedad"}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input name="name" placeholder="Nombre y apellido" className="form-input" />
        <input name="phone" placeholder="Teléfono / WhatsApp" className="form-input" />
      </div>
      <input name="email" placeholder="Email" className="form-input" />
      <textarea
        name="message"
        rows={5}
        placeholder="Contanos qué propiedad te interesa y cómo preferís que te contactemos."
        className="form-input min-h-36 resize-none"
      />

      {state.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-300">Tu consulta fue enviada correctamente.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-champagne px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-night transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar consulta"}
      </button>
    </form>
  );
}
