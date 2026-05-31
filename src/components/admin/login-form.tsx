"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/actions/auth";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-gold">Acceso seguro</p>
        <h1 className="font-serif text-4xl text-ivory">Panel de administración</h1>
      </div>

      <input name="email" type="email" placeholder="Email" className="form-input" />
      <input name="password" type="password" placeholder="Contraseña" className="form-input" />

      {state.error && <p className="text-sm text-red-300">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-champagne px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-night transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
