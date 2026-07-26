import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Políticas de Privacidad y Términos | Casa Tuning",
  description: "Políticas públicas de tratamiento de datos personales, privacidad y términos de servicio de Casa Tuning.",
};

export default function PublicPoliticasPrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111113] flex flex-col antialiased selection:bg-[#C9A84C]/30 select-text">
      {/* PUBLIC HEADER BAR */}
      <header className="h-16 border-b border-zinc-200 bg-white/90 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#0A0A0C] border border-zinc-800 flex items-center justify-center text-[#C9A84C] font-extrabold text-sm shadow-xs">
            CT
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              Casa Tuning
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBF5E6] text-[#9A7A28] border border-[#C9A84C]/30">
                Público
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Términos de Servicio y Tratamiento de Datos Personales
            </p>
          </div>
        </div>
      </header>

      {/* MAIN PUBLIC CONTENT */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-6 max-w-4xl mx-auto w-full">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-850 to-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-zinc-800">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-44 h-44 bg-[#C9A84C]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E5C978] text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Documento Público Oficial
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Políticas de Privacidad, Tratamiento de Datos y Términos de Servicio
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              En <strong>Casa Tuning</strong> garantizamos la protección de la información personal de nuestros clientes y el manejo transparente de las órdenes de recepción de vehículos, conforme a la Ley 1581 de 2012 y normas de protección al consumidor en Colombia.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/80 mt-2">
              <span>Publicado: Julio 2026</span>
              <span>·</span>
              <span>Versión: 1.2 Pública</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 1: Tratamiento de Datos Personales (Habeas Data) */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="h-11 w-11 rounded-xl bg-[#FBF5E6] border border-[#C9A84C]/30 flex items-center justify-center text-[#9A7A28] shrink-0 shadow-2xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                1. Autorización de Tratamiento de Datos Personales (Habeas Data)
              </h3>
              <p className="text-xs text-zinc-500">
                Cumplimiento estricto de la Ley 1581 de 2012 y Decreto Reglametario 1377 de 2013 de Colombia.
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-zinc-650 space-y-3 leading-relaxed">
            <p>
              Al aceptar de forma explícita mediante la casilla de verificación o firma digital en nuestros formularios físicos o electrónicos, el titular de la información autoriza de manera previa, expresa e informada a <strong>Casa Tuning</strong> para recolectar, almacenar, usar, procesar y transmitir sus datos personales (tales como nombre, teléfono, documento de identidad, correo electrónico y datos técnicos del vehículo).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-zinc-800 text-xs sm:text-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#9A7A28] shrink-0" />
                  Finalidad Operativa
                </div>
                <p className="text-xs text-zinc-500 leading-normal">
                  Registro de órdenes de trabajo, seguimiento del estado de la personalización/servicio y emisión del certificado de entrega.
                </p>
              </div>
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-zinc-800 text-xs sm:text-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 text-[#9A7A28] shrink-0" />
                  Comunicaciones Directas
                </div>
                <p className="text-xs text-zinc-500 leading-normal">
                  Notificaciones de avance vía WhatsApp y correo electrónico, resúmenes técnicos e información relevante de su orden.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Derechos del Titular */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="h-11 w-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 shadow-2xs">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                2. Derechos del Titular de la Información
              </h3>
              <p className="text-xs text-zinc-500">
                Garantías legales consagradas para los propietarios y clientes.
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-zinc-650 space-y-3 leading-relaxed">
            <p className="font-semibold text-zinc-800">
              Usted como titular tiene derecho en todo momento a:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-600">
              <li>Conocer, actualizar y rectificar sus datos personales almacenados en nuestras bases de datos.</li>
              <li>Solicitar prueba de la autorización otorgada para el tratamiento de su información.</li>
              <li>Ser informado sobre el uso que Casa Tuning ha dado a sus datos.</li>
              <li>Revocar la autorización o solicitar la supresión de datos cuando considere que no se respetan los principios legales.</li>
              <li>Acceder en forma gratuita a sus datos personales procesados.</li>
            </ul>
          </div>
        </div>

        {/* SECCIÓN 3: Condiciones de Recepción e Inventario del Vehículo */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="h-11 w-11 rounded-xl bg-[#FBF5E6] border border-[#C9A84C]/30 flex items-center justify-center text-[#9A7A28] shrink-0 shadow-2xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                3. Condiciones de Recepción, Inventario y Fotografía de Evidencias
              </h3>
              <p className="text-xs text-zinc-500">
                Normas claras para la entrega y custodia de vehículos en nuestras instalaciones.
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-zinc-650 space-y-3 leading-relaxed">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#9A7A28] mt-0.5 shrink-0" />
                <p>
                  <strong>Inspección de Entrega:</strong> Al ingresar el vehículo, se efectúa un checklist físico y visual del estado del automóvil o motocicleta. Cualquier novedad relevante (rayones, abolladuras o repuestos ausentes) queda registrada.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#9A7A28] mt-0.5 shrink-0" />
                <p>
                  <strong>Registro de Fotografías:</strong> Casa Tuning toma fotografías de respaldo como evidencia de novedades encontradas al momento del ingreso. Dichas imágenes forman parte del acta digital de recepción.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#9A7A28] mt-0.5 shrink-0" />
                <p>
                  <strong>Objetos de Valor:</strong> Se solicita a los clientes no dejar elementos personales o de valor no fijados al vehículo. Casa Tuning únicamente responde por las partes integrales e inventariadas en el acta.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Validez Legal de la Firma Digital */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="h-11 w-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 shadow-2xs">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                4. Validez de la Firma Digital
              </h3>
              <p className="text-xs text-zinc-500">
                Respaldo jurídico mediante firma electrónica conforme a la Ley 527 de 1999.
              </p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-zinc-650 space-y-3 leading-relaxed">
            <p>
              La firma digital recolectada en nuestros dispositivos móviles o tabletas posee plena validez legal como <strong>firma electrónica y mensaje de datos</strong> bajo la Ley 527 de 1999 de Colombia, obligando válidamente a las partes conforme a lo acordado en la recepción.
            </p>
          </div>
        </div>

        {/* PUBLIC FOOTER */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 shadow-2xs">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-[#9A7A28] shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 block text-xs sm:text-sm">Casa Tuning · Taller Especializado</span>
              <span>Para consultas o peticiones de Habeas Data, comuníquese con nuestra atención al cliente.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
