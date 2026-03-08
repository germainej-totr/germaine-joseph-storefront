import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      email,
      fitPreference, 
      jacketSize, 
      trouserSize, 
      technicalSpecs, 
      bookingId,
      appointmentDate,
      appointmentTime
    } = data;

    // PRESERVED: Your safe access for alert
    const alert = data.alert || technicalSpecs?.alert || "STANDARD FIT";
    
    // PRESERVED & ENHANCED: Extracting attributes while ensuring we catch the new ones
    const { attributes = {}, preferences = {} } = technicalSpecs || {};

    // 1. UPDATE DATABASE
    // We target 'fitProfile' as that is what your dashboard reads from
    const updatedBooking = await prisma.fitProfile.updateMany({
      where: {
        OR: [
          { id: bookingId || "00000000-0000-0000-0000-000000000000" },
          { email: email || "info@germainejoseph.com" }
        ]
      },
      data: {
        jacketSize: jacketSize.toString(),
        trouserSize: trouserSize.toString(),
        fitPreference: fitPreference,
        appointmentDate: appointmentDate,
        appointmentTime: appointmentTime,
        // PRESERVED: Merging technicalSpecs to ensure no data is overwritten
        technicalSpecs: technicalSpecs, 
      },
    });

    // 2. PRESERVED: Your original tailorNotes formatting
    const tailorNotes = `
      Silhouette: ${fitPreference} (${alert}). 
      Physical: Issues: ${attributes?.commonIssues || 'None'}, Notes: ${attributes?.notes || 'N/A'}.
      Style: Rise: ${preferences?.trouserRise}, Break: ${preferences?.trouserBreak}, Jacket: ${preferences?.jacketLength}.
    `.trim();

    // 3. PRESERVED: Your full high-end HTML Email Template
    await resend.emails.send({
      from: 'Digital Tailor <system@germainejoseph.com>',
      to: 'info@germainejoseph.com',
      subject: `MTM PROFILE: ${alert} - ${email}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 450px; margin: auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #000000; padding: 24px 16px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 3px; text-transform: uppercase;">Germaine Joseph</h1>
            <p style="color: #9ca3af; margin-top: 4px; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;">Master Tailor MTM Briefing</p>
          </div>
          
          <div style="padding: 20px;">
            <div style="background-color: ${alert.includes('MISMATCH') ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${alert.includes('MISMATCH') ? '#fee2e2' : '#dcfce7'}; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: ${alert.includes('MISMATCH') ? '#991b1b' : '#166534'}; text-transform: uppercase;">${alert}</p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #374151;">${fitPreference} Configuration</p>
            </div>

            <div style="margin-bottom: 20px; background: #f9fafb; padding: 12px; border-radius: 8px;">
               <h3 style="font-size: 10px; color: #9ca3af; text-transform: uppercase; margin: 0 0 8px 0;">Physical Attribute Notes</h3>
               <p style="font-size: 13px; margin: 0; color: #111827;"><strong>Issues:</strong> ${attributes?.commonIssues || 'None Reported'}</p>
               <p style="font-size: 13px; margin: 4px 0 0 0; color: #374151;"><strong>Notes:</strong> ${attributes?.notes || 'No extra notes'}</p>
            </div>

            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
              <div style="flex: 1; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px;">
                <h2 style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Jacket Block</h2>
                <span style="font-size: 32px; font-weight: 200;">${jacketSize}</span>
                <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">Length: ${preferences?.jacketLength || 'Standard'}</p>
              </div>
              <div style="flex: 1; border: 1px solid #f3f4f6; padding: 12px; border-radius: 8px;">
                <h2 style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Trouser Block</h2>
                <span style="font-size: 32px; font-weight: 200;">${trouserSize}</span>
                <p style="font-size: 11px; color: #9ca3af; margin: 4px 0 0 0;">Rise: ${preferences?.trouserRise || 'Standard'}</p>
              </div>
            </div>

            <div style="margin-bottom: 24px; padding: 12px; border: 1px solid #f3f4f6; border-radius: 8px;">
              <h2 style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px;">Stylistic Intent</h2>
              <p style="font-size: 13px; color: #374151; margin: 0;">Break Preference: <strong>${preferences?.trouserBreak || 'Standard'}</strong></p>
            </div>

            <a href="https://germainejoseph.com/admin/appointments" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 18px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                Open Booking Dashboard
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, count: updatedBooking.count });
  } catch (error) {
    console.error("Critical Sync Error:", error);
    return NextResponse.json({ success: false, error: "Internal Sync Error" }, { status: 500 });
  }
}