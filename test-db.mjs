// test-db.mjs
const testData = {
  email: "bespoke-test@germainejoseph.com",
  category: "jacket",
  measurements: {
    chest_cm: 102.5,
    waist_cm: 88.0,
    shoulder_cm: 44.5
  },
  source: "manual_test"
};

async function runTest() {
  console.log("🚀 Starting API Connection Test...");
  
  try {
    const response = await fetch('http://localhost:3000/api/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ SUCCESS: Data committed to Postgres!");
      console.log("Profile ID:", result.data.profile.id);
      console.log("Measurement Version:", result.data.newEntry.version);
    } else {
      console.error("❌ FAILED:", result.error);
    }
  } catch (err) {
    console.error("❌ CONNECTION ERROR: Is your Next.js server running?", err.message);
  }
}

runTest();