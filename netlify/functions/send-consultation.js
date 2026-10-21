// Envía el formulario de contacto como un mail con diseño propio (HTML de marca)
// usando la API de Resend. Reemplaza a FormSubmit: acá sí controlamos el estilo
// del mail y los adjuntos no quedan atados a los límites del plan gratis de
// EmailJS. Necesita las variables de entorno RESEND_API_KEY (y opcionalmente
// CONTACT_EMAIL y FROM_EMAIL) configuradas en Netlify (Site settings > Environment variables).

const escapeHtml = (value) =>
  String(value || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

const buildHtml = ({ nombre, telefono, email, area, detalle }) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#eef0f4;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e5ea;">
    <div style="background:#0f1e3f;padding:24px 32px;">
      <span style="font-family:Georgia,serif;font-weight:700;font-size:20px;color:#cdaa80;">GONZÁLEZ <span style="color:#997953;">&amp;</span> PIRES</span>
    </div>
    <div style="padding:32px;">
      <h2 style="font-family:Georgia,serif;color:#1c2135;margin:0 0 20px;font-size:20px;">Nueva consulta desde la web</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1c2135;">
        <tr><td style="padding:8px 0;color:#5b6172;width:140px;vertical-align:top;">Nombre</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(nombre)}</td></tr>
        <tr><td style="padding:8px 0;color:#5b6172;vertical-align:top;">Teléfono</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(telefono)}</td></tr>
        <tr><td style="padding:8px 0;color:#5b6172;vertical-align:top;">Email</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:8px 0;color:#5b6172;vertical-align:top;">Área</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(area || 'Consulta general')}</td></tr>
      </table>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e3e5ea;">
        <p style="color:#5b6172;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.04em;">Detalle del caso</p>
        <p style="color:#1c2135;font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0;">${escapeHtml(detalle) || '(sin detalle)'}</p>
      </div>
    </div>
    <div style="background:#eef0f4;padding:16px 32px;text-align:center;">
      <span style="font-size:11px;color:#5b6172;">Estudio Jurídico Integral · González &amp; Pires</span>
    </div>
  </div>
</div>`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { nombre, telefono, email, area, detalle, adjuntos } = data;
  if (!nombre || !telefono || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Faltan campos obligatorios' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Falta configurar RESEND_API_KEY en Netlify' }) };
  }
  const TO_EMAIL = process.env.CONTACT_EMAIL || 'ipseidor@gmail.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  const attachments = Array.isArray(adjuntos)
    ? adjuntos
        .filter((f) => f && f.content && f.name)
        .slice(0, 5)
        .map((f) => ({ filename: f.name, content: f.content }))
    : [];

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `González & Pires <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Nueva consulta de ${nombre} — ${area || 'Consulta general'}`,
        html: buildHtml({ nombre, telefono, email, area, detalle }),
        attachments,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: errText }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
