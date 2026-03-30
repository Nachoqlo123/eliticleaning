export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-900">
      <div className="mx-auto max-w-[900px] px-5 md:px-6 py-10 md:py-14">
        <div className="rounded-3xl bg-white p-7 md:p-10 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
          <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: "#0B1C3A" }}>Términos y condiciones</h1>
          <p className="mt-3 text-slate-600">Estas condiciones regulan la compra de productos y contratación de servicios en Elite Cleaning.</p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="font-semibold text-slate-900">1. Servicio y cobertura</h2>
              <p className="mt-1">Los servicios se prestan según disponibilidad operativa y zonas de cobertura vigentes al momento de la reserva.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">2. Cotización y confirmación</h2>
              <p className="mt-1">Toda cotización puede variar si cambian las condiciones informadas. La reserva queda confirmada tras validación del pago.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">3. Uso de productos y gift cards</h2>
              <p className="mt-1">Los productos y gift cards adquiridos son de uso personal o comercial del cliente, bajo las instrucciones indicadas en cada ficha.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">4. Cambios</h2>
              <p className="mt-1">Las solicitudes de modificación de fecha u horario deben realizarse con anticipación para gestionar reprogramación sin afectar la agenda.</p>
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
