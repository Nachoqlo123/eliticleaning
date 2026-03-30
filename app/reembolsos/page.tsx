export default function ReembolsosPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-900">
      <div className="mx-auto max-w-[900px] px-5 md:px-6 py-10 md:py-14">
        <div className="rounded-3xl bg-white p-7 md:p-10 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
          <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: "#0B1C3A" }}>Política de cambios y reembolsos</h1>
          <p className="mt-3 text-slate-600">Buscamos resolver cada caso de forma justa y transparente para clientes de productos y servicios.</p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="font-semibold text-slate-900">1. Reagendamiento de servicios</h2>
              <p className="mt-1">Puedes reagendar con aviso previo. Si el servicio ya fue asignado, la nueva fecha queda sujeta a disponibilidad.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">2. Productos</h2>
              <p className="mt-1">Aceptamos solicitudes de cambio en productos sin uso y en buen estado, dentro del plazo informado por soporte.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">3. Reembolsos</h2>
              <p className="mt-1">Si corresponde devolución, se procesa al mismo medio de pago o mediante acuerdo comercial con el cliente.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">4. Gift Cards</h2>
              <p className="mt-1">Las Gift Cards son de uso en plataforma y no son canjeables por efectivo, salvo obligación legal aplicable.</p>
            </section>
          </div>

          <div className="mt-8">
            <a href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Volver al inicio</a>
          </div>
        </div>
      </div>
    </div>
  );
}
