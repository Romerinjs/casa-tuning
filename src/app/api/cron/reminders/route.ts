import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppReservationReminderAction } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CRON_SECRET || "casatuning-cron-secret";

    // Validate Authorization
    const isAuthorized =
      key === secret ||
      (authHeader && authHeader === `Bearer ${secret}`);

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find pending reservations scheduled within the next 24 hours without reminder sent
    const pendingReservations = await prisma.reservation.findMany({
      where: {
        status: "PENDIENTE",
        reminderSent: false,
        scheduledAt: {
          gte: now,
          lte: next24Hours,
        },
      },
      select: {
        id: true,
        code: true,
        scheduledAt: true,
      },
    });

    let sentCount = 0;
    for (const res of pendingReservations) {
      const success = await sendWhatsAppReservationReminderAction(res.id);
      if (success) {
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      found: pendingReservations.length,
      remindersSent: sentCount,
    });
  } catch (error) {
    console.error("[Cron Reminders API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error procesando cron de recordatorios",
      },
      { status: 500 }
    );
  }
}
