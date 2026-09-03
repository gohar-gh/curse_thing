"use client";

import { useActionState } from "react";
import { unpublishCertificate, type UnpublishFormState } from "./actions";

const initialState: UnpublishFormState = {};

export function UnpublishForm() {
  const [state, formAction] = useActionState(unpublishCertificate, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label htmlFor="slug" className="block text-xs font-mono tracking-wide text-gray-500 mb-1">
          CERTIFICATE SLUG
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          placeholder="04000"
          className="w-full px-3 py-2 border border-gray-300 font-mono text-sm"
        />
      </div>
      <div>
        <label htmlFor="token" className="block text-xs font-mono tracking-wide text-gray-500 mb-1">
          ADMIN TOKEN
        </label>
        <input
          id="token"
          name="token"
          type="password"
          required
          className="w-full px-3 py-2 border border-gray-300 font-mono text-sm"
        />
      </div>
      <button
        type="submit"
        className="bg-black text-white px-4 py-2 font-mono text-sm w-fit"
      >
        Unpublish
      </button>
      {state.message && (
        <p className={`text-sm font-mono ${state.ok ? "text-green-700" : "text-red-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
