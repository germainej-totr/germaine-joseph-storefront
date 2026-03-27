import { Resend } from "resend";
import { render } from "@react-email/render";
import { BookingConfirmationEmail } from "@/components/emails/BookingConfirmation";

type SmartFitEmailInput = {
  to?: string;
  customerName: string;
  customerEmail?: string;
  chestCm: number;
  waistCm: number;
  fitPreference: string;
  jacketSize?: number | null;
  trouserSize?: number | null;
  isMismatch?: boolean;
  alertMessage?: string;
  recordId?: string | number;
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSmartFitSubmissionEmail(input: SmartFitEmailInput) {
  const to = input.to ?? "info@germainejoseph.com";
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: `Smart Fit Submission: ${input.customerName}`,
      html: `
        <h2>New Smart Fit Submission</h2>
        <p><strong>Name:</strong> ${input.customerName}</p>
        <p><strong>Email:</strong> ${input.customerEmail || "N/A"}</p>
        <p><strong>Chest:</strong> ${input.chestCm} cm</p>
        <p><strong>Waist:</strong> ${input.waistCm} cm</p>
        <p><strong>Fit:</strong> ${input.fitPreference}</p>
        <p><strong>Jacket Size:</strong> ${input.jacketSize ?? "N/A"}</p>
        <p><strong>Trouser Size:</strong> ${input.trouserSize ?? "N/A"}</p>
        <p><strong>Mismatch:</strong> ${input.isMismatch ? "Yes" : "No"}</p>
        <p><strong>Alert:</strong> ${input.alertMessage || "None"}</p>
        <p><strong>Record ID:</strong> ${input.recordId ?? "N/A"}</p>
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

type BookingConfirmationEmailInput = {
  to: string;
  appointmentLabel: string;
  appointmentMode: string;
  location: string;
  googleCalendarUrl: string;
  outlookCalendarUrl: string;
};

export async function sendBookingConfirmationEmail(input: BookingConfirmationEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const html = await render(
      BookingConfirmationEmail({
        appointmentLabel: input.appointmentLabel,
        appointmentMode: input.appointmentMode,
        location: input.location,
        googleCalendarUrl: input.googleCalendarUrl,
        outlookCalendarUrl: input.outlookCalendarUrl,
      }),
    );

    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: `Appointment Confirmed — Germaine Joseph`,
      html,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}