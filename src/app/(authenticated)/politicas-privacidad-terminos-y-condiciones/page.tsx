import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Eye,
  Scale,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Políticas de Privacidad y Términos | Casa Tuning",
  description: "Políticas de tratamiento de datos personales, privacidad y términos de servicio de Casa Tuning.",
};

export default function PoliticasPrivacidadPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-[#F7F7F8]">
      {/* HEADER BAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/recepcion"
            className="h-9 w-9 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors"
            title="Volver a Recepción"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              Políticas de Privacidad y Términos
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBF5E6] text-[#9A7A28] border border-[#C9A84C]/30">
                Casa Tuning
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/recepcion"
            className="h-10 px-4 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Link>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
        {/* Banner de Presentación */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-850 to-zinc-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-zinc-800">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-40 h-40 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E5C978] text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Protección de Datos & Términos de Servicio
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              Política de Tratamiento de Datos Personales y Condiciones de Recepción
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              En <strong>Casa Tuning</strong> nos comprometemos con la seguridad de la información personal de nuestros clientes y el cuidado responsable de los vehículos bajo nuestra custodia, en cumplimiento de la Ley 1581 de 2012 y normas concordantes de Colombia.
            </p>
            <p className="text-[11px] text-zinc-400 font-mono pt-1">
              Última actualización: Julio 2026 · Versión 1.2
            </p>
          </div>
        </div>

        {/* SECCIÓN 1: Tratamiento de Datos (Habeas Data) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF5E6] border border-[#C9A84C]/30 flex items-center justify-center text-[#9A7A28] shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                1. Autorización de Tratamiento de Datos Personales (Habeas Data)
              </h3>
              <p className="text-xs text-zinc-500">
                Conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-650 space-y-3 leading-relaxed">
            <p>
              Al aceptar expresamente este documento mediante la casilla de verificación o la firma digital en el formulario de recepción, el titular autoriza de manera libre, previa, expresa e informada a <strong>Casa Tuning</strong> para recolectar, almacenar, usar, circular y procesar sus datos personales (nombre, documento de identidad, teléfono, correo electrónico y datos asociados a su vehículo).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#9A7A28]" />
                  Finalidad Comercial y Operativa
                </div>
                <p className="text-[11px] text-zinc-500">
                  Gestión de órdenes de trabajo, seguimiento del estado de servicios, emisión de comprobantes y comunicación del avance del vehículo.
                </p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-[#9A7A28]" />
                  Notificaciones Automatizadas
                </div>
                <p className="text-[11px] text-zinc-500">
                  Envío de confirmaciones por correo electrónico y mensajería instantánea (WhatsApp) con resúmenes y certificados digitales.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Derechos del Titular */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                2. Derechos del Titular de la Información
              </h3>
              <p className="text-xs text-zinc-500">
                Sus derechos como cliente y titular de los datos según la legislación colombiana.
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-650 space-y-2 leading-relaxed">
            <p className="font-semibold text-zinc-800">
              Como titular de sus datos personales, usted tiene derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-600">
              <li>Conocer, actualizar y rectificar sus datos personales frente a Casa Tuning.</li>
              <li>Solicitar prueba de la autorización otorgada para el tratamiento de su información.</li>
              <li>Ser informado sobre el uso que se le ha dado a sus datos personales.</li>
              <li>Revocar la autorización o solicitar la supresión de sus datos cuando no se respeten los principios constitucionales y legales.</li>
              <li>Acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.</li>
            </ul>
          </div>
        </div>

        {/* SECCIÓN 3: Condiciones de Recepción del Vehículo */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-[#FBF5E6] border border-[#C9A84C]/30 flex items-center justify-center text-[#9A7A28] shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                3. Condiciones de Recepción, Inventario y Fotografía de Evidencias
              </h3>
              <p className="text-xs text-zinc-500">
                Normas de custodia y verificación del estado del vehículo al momento de la entrega.
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-650 space-y-3 leading-relaxed">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9A7A28] mt-0.5 shrink-0" />
                <p>
                  <strong>Inspección y Checklist:</strong> El cliente y el asesor de servicio realizan conjuntamente la verificación del estado exterior e interior del vehículo. Las novedades (rayones, golpes o fallas previas) quedan registradas digitalmente.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9A7A28] mt-0.5 shrink-0" />
                <p>
                  <strong>Evidencias Fotográficas:</strong> Casa Tuning toma fotografías de soporte cuando se identifican novedades previas en el vehículo. Dichas fotos son de uso exclusivo para respaldo del estado de recepción.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9A7A28] mt-0.5 shrink-0" />
                <p>
                  <strong>Objetos de Valor:</strong> Se recomienda no dejar objetos de valor no fijados al vehículo. Casa Tuning responde únicamente por los componentes instalados e inventariados en la orden de recepción.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Validez de la Firma Digital */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                4. Validez y Seguridad de la Firma Digital
              </h3>
              <p className="text-xs text-zinc-500">
                Cumplimiento de la Ley 527 de 1999 sobre mensajes de datos y firmas electrónicas.
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-650 space-y-3 leading-relaxed">
            <p>
              La firma digital plasmada en la pantalla táctil o dispositivo de recepción constituye un <strong>mensaje de datos con firma electrónica</strong> en los términos de la Ley 527 de 1999. Esta firma tiene idéntica validez jurídica que una firma manuscrita y acredita la aprobación conforme del inventario, servicios seleccionados y aceptación de términos.
            </p>
          </div>
        </div>

        {/* FOOTER INFORMATIVO */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-[#9A7A28] shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 block">Casa Tuning · Taller Especializado</span>
              <span>Si tiene dudas respecto al tratamiento de sus datos, contáctenos en nuestro centro de atención.</span>
            </div>
          </div>
          <Link
            href="/recepcion"
            className="h-10 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar al Formulario
          </Link>
        </div>
      </div>
    </div>
  );
}
