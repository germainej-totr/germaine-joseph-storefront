import { Resend } from "resend";
import { render } from "@react-email/render";
import { BookingConfirmationEmail } from "@/components/emails/BookingConfirmation";
import RefitReminderEmail from "@/components/emails/RefitReminderEmail";

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

type BookingLifecycleEmailInput = {
  to: string;
  appointmentLabel: string;
  appointmentMode: string;
  location: string;
  googleCalendarUrl?: string;
  outlookCalendarUrl?: string;
  icsDownloadUrl?: string;
};

type FitRefreshRequiredEmailInput = BookingLifecycleEmailInput & {
  fitRefreshUrl: string;
};

type SavedFitReactivationEmailInput = {
  to: string;
  customerName: string;
  profileAgeDays: number;
  reactivationUrl: string;
};

type RefitReminderLifecycleEmailInput = {
  to: string;
  customerName: string;
  profileAgeDays: number;
  lastFitDate: Date;
  reengagementLink: string;
};

type BookingTimelineEmailInput = {
  to: string;
  appointmentLabel: string;
  appointmentMode: string;
  location: string;
  manageUrl?: string;
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

export async function sendBookingRescheduledEmail(input: BookingLifecycleEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Appointment Rescheduled - Germaine Joseph',
      html: `
        <h2>Appointment Rescheduled</h2>
        <p>Your fitting appointment has been successfully rescheduled.</p>
        <p><strong>Date & Time:</strong> ${input.appointmentLabel}</p>
        <p><strong>Mode:</strong> ${input.appointmentMode}</p>
        <p><strong>Location:</strong> ${input.location}</p>
        ${input.googleCalendarUrl ? `<p><a href="${input.googleCalendarUrl}">Add to Google Calendar</a></p>` : ''}
        ${input.outlookCalendarUrl ? `<p><a href="${input.outlookCalendarUrl}">Add to Outlook Calendar</a></p>` : ''}
        ${input.icsDownloadUrl ? `<p><a href="${input.icsDownloadUrl}">Download ICS Invite</a></p>` : ''}
        <p>If this was not requested by you, please reply to this email immediately.</p>
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendBookingCancelledEmail(input: BookingLifecycleEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Appointment Cancelled - Germaine Joseph',
      html: `
        <h2>Appointment Cancelled</h2>
        <p>Your fitting appointment has been cancelled.</p>
        <p><strong>Previous Date & Time:</strong> ${input.appointmentLabel}</p>
        <p><strong>Mode:</strong> ${input.appointmentMode}</p>
        <p><strong>Location:</strong> ${input.location}</p>
        <p>If you would like to rebook, please return to the booking page.</p>
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendFitRefreshRequiredEmail(input: FitRefreshRequiredEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Action Needed: Refresh Your Fit Profile - Germaine Joseph',
      html: `
        <h2>Fit Profile Refresh Needed</h2>
        <p>We have reserved your appointment slot, but your fit profile needs a quick refresh before final confirmation.</p>
        <p><strong>Reserved Slot:</strong> ${input.appointmentLabel}</p>
        <p><strong>Mode:</strong> ${input.appointmentMode}</p>
        <p><strong>Location:</strong> ${input.location}</p>
        <p><a href="${input.fitRefreshUrl}">Complete Fit Refresh</a></p>
        <p>Once completed, our system will finalize your booking details.</p>
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendSavedFitReactivationEmail(input: SavedFitReactivationEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Your Saved Fit Is Ready to Re-Activate - Germaine Joseph',
      html: `
        <h2>Your Saved Fit Is Nearly Due for Refresh</h2>
        <p>Hi ${input.customerName},</p>
        <p>Your fit profile is currently <strong>${input.profileAgeDays} days old</strong>.</p>
        <p>Before your next order, we recommend a quick fit check so your saved profile stays precise.</p>
        <p><a href="${input.reactivationUrl}">Review and reactivate your saved fit</a></p>
        <p>If your measurements have changed, you can start a guided refit flow directly from that page.</p>
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendRefitReminderLifecycleEmail(input: RefitReminderLifecycleEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const html = await render(
      RefitReminderEmail({
        customerName: input.customerName,
        lastFitDate: input.lastFitDate,
        estimatedDaysSinceFit: input.profileAgeDays,
        reengagementLink: input.reengagementLink,
      }),
    );

    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Your Fit Refresh Is Ready - Updated Measurements',
      html,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendBookingUpcomingReminderEmail(input: BookingTimelineEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Reminder: Your Fitting Is Tomorrow - Germaine Joseph',
      html: `
        <h2>Your Appointment Is Coming Up</h2>
        <p>This is a reminder for your fitting appointment:</p>
        <p><strong>Date & Time:</strong> ${input.appointmentLabel}</p>
        <p><strong>Mode:</strong> ${input.appointmentMode}</p>
        <p><strong>Location:</strong> ${input.location}</p>
        ${input.manageUrl ? `<p><a href="${input.manageUrl}">Manage your booking</a></p>` : ''}
        <p>We look forward to welcoming you.</p>
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendBookingPostVisitFollowupEmail(input: BookingTimelineEmailInput) {
  const from = process.env.RESEND_FROM;

  if (!process.env.RESEND_API_KEY || !from) {
    return { ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: 'Thank You for Visiting Germaine Joseph',
      html: `
        <h2>Thank You for Your Appointment</h2>
        <p>We hope your fitting on <strong>${input.appointmentLabel}</strong> was excellent.</p>
        <p><strong>Mode:</strong> ${input.appointmentMode}</p>
        <p><strong>Location:</strong> ${input.location}</p>
        <p>Your fit details are now available for your next made-to-measure order.</p>
        ${input.manageUrl ? `<p><a href="${input.manageUrl}">View booking details</a></p>` : ''}
      `,
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}