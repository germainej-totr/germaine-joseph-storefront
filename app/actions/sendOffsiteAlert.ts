'use server';
import { Resend } from 'resend';
import { OffsiteAlertTemplate } from '@/components/emails/OffsiteAlert';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOffsiteAlert(data: {
  email: string;
  appointmentMode: string;
  address?: string;
  profileName: string;
  date: string;
  time: string;
}) {
  const offsiteModes = ['Home', 'Office', 'Location'];
  if (!offsiteModes.includes(data.appointmentMode)) return { ok: true, skipped: true };

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    console.error('Missing RESEND_API_KEY or RESEND_FROM');
    return { ok: false, error: 'Missing RESEND_API_KEY or RESEND_FROM' };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [process.env.ALERT_TO_EMAIL || 'info@germainejoseph.com'],
      subject: `FITTING: ${data.profileName} | ${data.date} @ ${data.time}`,
      react: React.createElement(OffsiteAlertTemplate, {
        email: data.email,
        mode: data.appointmentMode,
        address: data.address || 'Address provided in dashboard',
        profileName: data.profileName,
        date: data.date,
        time: data.time,
      }),
    });

    return { ok: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send offsite alert:', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}