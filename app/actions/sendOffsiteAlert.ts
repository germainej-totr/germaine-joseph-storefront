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
  
  if (!offsiteModes.includes(data.appointmentMode)) return;

  try {
    await resend.emails.send({
      from: 'Maison Alerts <system@yourdomain.com>',
      to: ['staff@yourdomain.com'], 
      subject: `FITTING: ${data.profileName} | ${data.date} @ ${data.time}`,
      
      react: React.createElement(OffsiteAlertTemplate, {
        email: data.email,
        mode: data.appointmentMode,
        address: data.address || 'Address provided in dashboard',
        profileName: data.profileName,
        date: data.date,
        time: data.time
      }),
    });
  } catch (error) {
    console.error("Failed to send offsite alert:", error);
  }
}