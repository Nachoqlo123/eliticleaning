export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-900">
      <div className="mx-auto max-w-[900px] px-5 md:px-6 py-10 md:py-14">
        <div className="rounded-3xl bg-white p-7 md:p-10 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
          <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: "#0B1C3A" }}>Política de privacidad</h1>
          <p className="mt-3 text-slate-600">Tratamos tus datos con confidencialidad y solo para gestionar tu cuenta, pedidos y atención comercial.</p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700">
            <section>
              <h2 className="font-semibold text-slate-900">1. Datos que recopilamos</h2>
              <p className="mt-1">Datos de contacto, historial de pedidos y preferencias necesarias para entregar servicio y soporte.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">2. Uso de la información</h2>
              <p className="mt-1">Usamos la información para procesar pagos, coordinar servicios, emitir comunicaciones operativas y mejorar la experiencia.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">3. Seguridad</h2>
              <p className="mt-1">Aplicamos medidas razonables de seguridad para proteger los datos frente a accesos no autorizados.</p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900">4. Derechos del usuario</h2>
              <p className="mt-1">Puedes solicitar actualización o eliminación de tus datos de contacto, sujeto a obligaciones legales vigentes.</p>
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
