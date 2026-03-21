import React from 'react';
import { Html, Body, Container, Section, Text, Link, Button } from '@react-email/components';

interface RefitReminderEmailProps {
  customerName: string;
  lastFitDate: Date;
  estimatedDaysSinceFit: number;
  reengagementLink?: string;
}

export default function RefitReminderEmail({
  customerName,
  lastFitDate,
  estimatedDaysSinceFit,
  reengagementLink,
}: RefitReminderEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://germainejoseph.com';
  const engageUrl = reengagementLink || `${baseUrl}/fit/smart?campaign=refit-reminder`;

  return (
    <Html>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '40px' }}>
          <Section style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
              It's Time for Your Fit Refresh
            </Text>
          </Section>

          <Section style={{ marginBottom: '30px', lineHeight: '1.6', color: '#333' }}>
            <Text>Hi {customerName},</Text>
            <Text>
              {{/* This uses the MTM gate logic: if it's been 6+ months since your last fit profile update, 
                we recommend refreshing your measurements for optimal tailoring precision. */}}
              Your most recent fit profile was from <strong>{lastFitDate.toLocaleDateString()}</strong> — that's{' '}
              <strong>{estimatedDaysSinceFit} days ago</strong>.
            </Text>
            <Text>
              At Germaine Joseph, we recommend updating your measurements every 6 months. This ensures your next order 
              fits perfectly, accounting for any changes in your body or style preferences.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Button
              href={engageUrl}
              style={{
                backgroundColor: '#000',
                color: '#fff',
                padding: '12px 32px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block',
              }}
            >
              Start Your Fit Refresh
            </Button>
          </Section>

          <Section style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '6px', marginBottom: '30px' }}>
            <Text style={{ fontSize: '14px', color: '#666' }}>
              <strong>What to expect:</strong> Our smart fit form takes just 3–5 minutes. We'll guide you through 
              jacket and trouser sizing, fabric preferences, and any custom tailoring notes. Your measurements are 
              securely stored and used only for your orders.
            </Text>
          </Section>

          <Section style={{ borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '12px', color: '#999' }}>
            <Text>
              Questions? Email us at <Link href="mailto:info@germainejoseph.com">info@germainejoseph.com</Link>
            </Text>
            <Text style={{ marginTop: '10px' }}>
              © 2026 Germaine Joseph. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
