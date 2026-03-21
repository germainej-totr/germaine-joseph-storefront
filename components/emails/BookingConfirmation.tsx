import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type BookingConfirmationEmailProps = {
  appointmentLabel: string;
  appointmentMode: string;
  location: string;
  googleCalendarUrl: string;
  outlookCalendarUrl: string;
};

export function BookingConfirmationEmail({
  appointmentLabel,
  appointmentMode,
  location,
  googleCalendarUrl,
  outlookCalendarUrl,
}: Readonly<BookingConfirmationEmailProps>) {
  return (
    <Html>
      <Head />
      <Preview>Your Germaine Joseph fitting is confirmed</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading as="h1" style={styles.title}>Booking Confirmed</Heading>
            <Text style={styles.subtitle}>Germaine Joseph Atelier</Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.paragraph}>
              Your fitting appointment has been confirmed. We are looking forward to welcoming you.
            </Text>

            <Section style={styles.detailBox}>
              <Text style={styles.detailText}>
                <strong>Date & Time:</strong> {appointmentLabel}
              </Text>
              <Text style={styles.detailText}>
                <strong>Mode:</strong> {appointmentMode}
              </Text>
              <Text style={styles.detailTextNoMargin}>
                <strong>Location:</strong> {location}
              </Text>
            </Section>

            <Text style={styles.label}>Add to calendar</Text>
            <Section style={styles.buttonsRow}>
              <Button href={googleCalendarUrl} style={styles.greenButton}>
                Google Calendar
              </Button>
              <Button href={outlookCalendarUrl} style={styles.darkButton}>
                Outlook Calendar
              </Button>
            </Section>

            <Text style={styles.footnote}>
              An invite file is attached to this email. Open the attachment to add this appointment to
              Apple Calendar, Outlook, or any calendar app that supports .ics files.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: '#f3f4f6',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: '0',
    padding: '20px 0',
  },
  container: {
    maxWidth: '520px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#000000',
    padding: '22px 16px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#ffffff',
    margin: '0',
    fontSize: '18px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  },
  subtitle: {
    color: '#9ca3af',
    margin: '6px 0 0',
    fontSize: '11px',
  },
  content: {
    padding: '22px',
  },
  paragraph: {
    marginTop: '0',
    color: '#111827',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  detailBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '14px',
    margin: '16px 0 20px',
  },
  detailText: {
    margin: '0 0 8px',
    fontSize: '13px',
    color: '#111827',
  },
  detailTextNoMargin: {
    margin: '0',
    fontSize: '13px',
    color: '#111827',
  },
  label: {
    fontSize: '12px',
    color: '#4b5563',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  buttonsRow: {
    marginBottom: '14px',
  },
  greenButton: {
    display: 'inline-block',
    padding: '10px 12px',
    borderRadius: '6px',
    textDecoration: 'none',
    backgroundColor: '#166534',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    marginRight: '8px',
  },
  darkButton: {
    display: 'inline-block',
    padding: '10px 12px',
    borderRadius: '6px',
    textDecoration: 'none',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
  },
  footnote: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0',
  },
};
