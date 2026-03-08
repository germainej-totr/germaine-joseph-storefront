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
  date: string; // NEW: Captured from Step 4
  time: string; // NEW: Captured from Step 4
}) {
  const offsiteModes = ['Home', 'Office', 'Location'];
  
  if (!offsiteModes.includes(data.appointmentMode)) return;

  try {
    await resend.emails.send({
      from: 'Maison Alerts <system@yourdomain.com>',
      to: ['staff@yourdomain.com'], 
      // Subject updated to be immediately actionable for the Tailor
      subject: `FITTING: ${data.profileName} | ${data.date} @ ${data.time}`,
      
      react: React.createElement(OffsiteAlertTemplate, {
        email: data.email,
        mode: data.appointmentMode,
        address: data.address || 'Address provided in dashboard',
        profileName: data.profileName,
        date: data.date, // Passed to React Template
        time: data.time  // Passed to React Template
      }),
    });
  } catch (error) {
    console.error("Failed to send offsite alert:", error);
  }
}