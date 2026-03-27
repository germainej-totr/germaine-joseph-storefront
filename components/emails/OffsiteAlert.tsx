// components/emails/OffsiteAlert.tsx

interface OffsiteAlertProps {
  email: string;
  mode: string;
  address: string;
  profileName: string;
  date: string; // Add this
  time: string; // Add this
}

export const OffsiteAlertTemplate: React.FC<Readonly<OffsiteAlertProps>> = ({
  email,
  mode,
  address,
  profileName,
  date,
  time
}) => (
  <div style={{ fontFamily: 'serif', padding: '20px' }}>
    <h1>New Fitting Request</h1>
    <p><strong>Client:</strong> {profileName}</p>
    <p><strong>Email:</strong> {email}</p>
    <p><strong>Mode:</strong> {mode}</p>
    <p><strong>Date:</strong> {date}</p>
    <p><strong>Time:</strong> {time}</p>
    <p><strong>Address:</strong> {address}</p>
    <hr />
    <p>Log into the Maison Dashboard to confirm this appointment.</p>
  </div>
);