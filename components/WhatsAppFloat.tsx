import React from "react";

const WHATSAPP_CHATBOT_URL = process.env.NEXT_PUBLIC_WHATSAPP_CHATBOT_URL ?? "";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const WHATSAPP_MESSAGE = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hola, quiero hablar con el chatbot de Elite Cleaning.";

export function WhatsAppFloat() {
  const cleanNumber = WHATSAPP_NUMBER.replace(/\D/g, "");
  const href =
    WHATSAPP_CHATBOT_URL ||
    (cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
      : `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir WhatsApp"
      title="Hablar por WhatsApp"
      className="group fixed bottom-6 right-6 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] ring-2 ring-white/95 transition-transform duration-300 hover:scale-105 active:scale-95 md:bottom-7 md:right-7 md:h-16 md:w-16"
    >
      <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 md:inline-flex">
        Escribenos por WhatsApp
      </span>
      <svg viewBox="0 0 24 24" className="h-7 w-7 md:h-8 md:w-8" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.058-.174-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01a1.09 1.09 0 0 0-.793.372c-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.414.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12.004 2.003c-5.514 0-9.99 4.476-9.99 9.99 0 1.767.463 3.491 1.343 5.01L2 22l5.119-1.343a9.95 9.95 0 0 0 4.885 1.28h.004c5.512 0 9.989-4.476 9.989-9.99 0-2.673-1.04-5.186-2.93-7.074a9.94 9.94 0 0 0-7.063-2.87zm0 18.188h-.003a8.24 8.24 0 0 1-4.188-1.14l-.3-.177-3.038.798.81-2.962-.195-.305a8.233 8.233 0 0 1-1.273-4.412c0-4.554 3.704-8.258 8.258-8.258a8.2 8.2 0 0 1 5.872 2.431 8.2 8.2 0 0 1 2.423 5.834c0 4.554-3.704 8.258-8.256 8.258z" />
      </svg>
    </a>
  );
}
