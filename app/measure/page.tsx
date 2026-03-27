"use client";
import { useState } from 'react';

export default function MeasurementGuide() {
  const [email, setEmail] = useState('');
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    shoulders: '',
    sleeveLength: '',
    neck: '',
  });
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    setStatus('Transmitting to the Anatomical Vault...');
    try {
      const response = await fetch('/api/measurements/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, measurements }),
      });
      
      if (response.ok) {
        setStatus('Measurements Secured Successfully.');
      } else {
        setStatus('Connection error. Please verify the Vault is active.');
      }
    } catch {
      setStatus('System error. Please try again.');
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#ffffff', // Your white background
      color: '#826300',           // Your gold text
      minHeight: '100vh', 
      padding: '60px 20px', 
      fontFamily: '"Times New Roman", Times, serif' 
    }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ letterSpacing: '8px', textTransform: 'uppercase', fontWeight: 'lighter', fontSize: '2.5rem' }}>
          Germaine Joseph
        </h1>
        <div style={{ width: '50px', height: '1px', backgroundColor: '#826300', margin: '20px auto' }}></div>
        <p style={{ fontStyle: 'italic', letterSpacing: '2px' }}>Anatomical Measurement Guide</p>
      </header>

      <div style={{ 
        maxWidth: '500px', 
        margin: '0 auto', 
        padding: '40px', 
        border: '0.5px solid #826300' // Thin gold border
      }}>
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Client Identifier (Email)
          </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: '1px solid #826300', 
              color: '#000000', // Your black input text
              outline: 'none',
              fontSize: '1rem'
            }}
            placeholder="bespoke@germainejoseph.com"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {Object.keys(measurements).map((key) => (
            <div key={key}>
              <label style={{ display: 'block', textTransform: 'uppercase', marginBottom: '8px', fontSize: '0.7rem', letterSpacing: '1px' }}>
                {key.replace(/([A-Z])/g, ' $1')} (cm)
              </label>
              <input 
                type="number" 
                onChange={(e) => setMeasurements({...measurements, [key]: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: 'transparent', 
                  border: 'none', 
                  borderBottom: '1px solid #826300', 
                  color: '#000000', // Your black input text
                  outline: 'none'
                }}
              />
            </div>
          ))}
        </div>

        <button 
          onClick={handleSave}
          style={{ 
            width: '100%', 
            marginTop: '50px', 
            padding: '18px', 
            backgroundColor: '#826300', 
            color: '#ffffff', 
            letterSpacing: '3px',
            textTransform: 'uppercase',
            border: 'none', 
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'opacity 0.3s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Secure to Vault
        </button>
        
        {status && <p style={{ textAlign: 'center', marginTop: '30px', color: '#000', fontSize: '0.9rem' }}>{status}</p>}
      </div>
    </div>
  );
}