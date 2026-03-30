const base = (process.env.LAUNCH_BASE_URL || 'https://germaine-joseph-storefront.vercel.app').replace(/\/$/, '');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(path, init) {
  const response = await fetch(`${base}${path}`, init);
  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { response, json, text };
}

async function main() {
  const email = `manual-flow-${Date.now()}@example.com`;
  const startDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const availability = await requestJson('/api/bookings/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: startDate, serviceType: 'showroom' }),
  });
  assert(availability.response.ok, `availability failed: ${availability.response.status} ${availability.text}`);
  const slot = availability.json?.availableSlots?.[0];
  assert(slot, 'availability returned no slots');
  console.log(`availability_status=${availability.response.status} date=${startDate} slot=${slot}`);

  const confirm = await requestJson('/api/bookings/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      serviceType: 'showroom',
      location: 'Maison Showroom',
      date: startDate,
      timeSlot: slot,
      customerEmail: email,
      notes: 'manual click-through smoke',
    }),
  });
  assert(confirm.response.ok && confirm.json?.success, `confirm failed: ${confirm.response.status} ${confirm.text}`);

  const bookingId = String(confirm.json.bookingId || '');
  const manageToken = String(confirm.json.manageToken || '');
  const manageUrl = String(confirm.json.manageUrl || '');
  assert(bookingId, 'confirm missing bookingId');
  assert(manageToken, 'confirm missing manageToken');
  assert(manageUrl, 'confirm missing manageUrl');
  console.log(`confirm_status=${confirm.response.status} bookingId=${bookingId}`);
  console.log('manage_token_present=true');

  const confirmPage = await fetch(manageUrl, { redirect: 'manual' });
  assert(confirmPage.ok, `manage page failed: ${confirmPage.status}`);
  console.log(`confirm_page_status=${confirmPage.status}`);

  const ics = await fetch(
    `${base}/api/bookings/ics?bookingId=${encodeURIComponent(bookingId)}&manageToken=${encodeURIComponent(manageToken)}`,
    { redirect: 'manual' },
  );
  assert(ics.ok, `ics failed: ${ics.status}`);
  console.log(`ics_status=${ics.status} content_type=${ics.headers.get('content-type') || ''}`);

  const rescheduleDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rescheduleAvailability = await requestJson(
    `/api/bookings/reschedule/availability?bookingId=${encodeURIComponent(bookingId)}&date=${encodeURIComponent(rescheduleDate)}&serviceType=showroom&manageToken=${encodeURIComponent(manageToken)}`,
    { method: 'GET' },
  );
  assert(
    rescheduleAvailability.response.ok && rescheduleAvailability.json?.success,
    `reschedule availability failed: ${rescheduleAvailability.response.status} ${rescheduleAvailability.text}`,
  );
  const rescheduleSlot = rescheduleAvailability.json?.availableSlots?.[0];
  assert(rescheduleSlot, 'reschedule availability returned no slots');
  console.log(
    `reschedule_availability_status=${rescheduleAvailability.response.status} date=${rescheduleDate} slot=${rescheduleSlot}`,
  );

  const reschedule = await requestJson('/api/bookings/reschedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId,
      date: rescheduleDate,
      timeSlot: rescheduleSlot,
      serviceType: 'showroom',
      manageToken,
    }),
  });
  assert(reschedule.response.ok && reschedule.json?.success, `reschedule failed: ${reschedule.response.status} ${reschedule.text}`);
  const nextManageToken = String(reschedule.json?.manageToken || manageToken);
  console.log(`reschedule_status=${reschedule.response.status} next_token_present=${nextManageToken ? 'true' : 'false'}`);

  const cancel = await requestJson(`/api/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel', manageToken: nextManageToken }),
  });
  assert(cancel.response.ok && cancel.json?.success, `cancel failed: ${cancel.response.status} ${cancel.text}`);
  console.log(`cancel_status=${cancel.response.status} success=${String(Boolean(cancel.json?.success))}`);

  console.log('manual_clickthrough_equivalent=passed');
}

main().catch((error) => {
  console.error(`manual_clickthrough_equivalent=failed error=${error.message}`);
  process.exitCode = 1;
});