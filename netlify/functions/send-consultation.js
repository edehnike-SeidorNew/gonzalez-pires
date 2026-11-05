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

// Netlify expone la URL del propio sitio desplegado en process.env.URL; se
// usa para que el logo del mail cargue desde una imagen alojada y pública
// (los data URI embebidos no siempre andan bien en clientes de correo).
const SITE_URL = process.env.URL || 'https://gonzalezypires.netlify.app';

const campo = (label, valor) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef0f4;">
            <p style="margin:0 0 3px;color:#9a7a53;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${label}</p>
            <p style="margin:0;color:#1c2135;font-size:15px;font-weight:600;">${valor}</p>
          </td>
        </tr>`;

const buildHtml = ({ nombre, telefono, email, area, detalle }) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#eef0f4;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e3e5ea;">

    <div style="background:#0f1e3f;padding:22px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding-right:12px;"><img src="${SITE_URL}/img/logo.png" width="36" height="36" alt="" style="display:block;"></td>
          <td style="font-family:Georgia,serif;font-weight:700;font-size:20px;color:#cdaa80;white-space:nowrap;">GONZÁLEZ <span style="color:#997953;">&amp;</span> PIRES</td>
        </tr>
      </table>
    </div>

    <div style="padding:32px 32px 8px;">
      <h2 style="font-family:Georgia,serif;color:#1c2135;margin:0 0 10px;font-size:21px;">Nueva consulta desde la web</h2>
      <div style="width:44px;height:3px;background:#cdaa80;margin:0 0 24px;"></div>
      <table style="width:100%;border-collapse:collapse;">
        ${campo('Nombre', escapeHtml(nombre))}
        ${campo('Teléfono', escapeHtml(telefono))}
        ${campo('Email', escapeHtml(email))}
        ${campo('Área de consulta', escapeHtml(area || 'Consulta general'))}
      </table>
      <div style="margin-top:22px;padding:18px 20px;background:#f8f6f2;border-radius:10px;border:1px solid #eee3d3;">
        <p style="color:#9a7a53;font-size:10px;margin:0 0 8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Detalle del caso</p>
        <p style="color:#1c2135;font-size:14px;line-height:1.65;white-space:pre-wrap;margin:0;">${escapeHtml(detalle) || '(sin detalle)'}</p>
      </div>
      <p style="margin:22px 0 0;color:#9aa0b4;font-size:11px;">Para responder, contestá directo a este mail — el Reply-To ya queda configurado a la casilla del cliente.</p>
    </div>

    <div style="background-color:#0f1e3f;background-image:url('${SITE_URL}/img/footer-bg.jpg');background-size:cover;background-position:center;" bgcolor="#0f1e3f" background="${SITE_URL}/img/footer-bg.jpg">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:30px 32px 24px;background:linear-gradient(rgba(15,30,63,.82),rgba(15,30,63,.9));">
            <img src="${SITE_URL}/img/logo.png" width="44" height="44" alt="" style="display:block;margin:0 auto 10px;">
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-weight:700;font-size:15px;color:#cdaa80;letter-spacing:.02em;">GONZÁLEZ &amp; PIRES</p>
            <p style="margin:0;color:#c7cade;font-size:11px;">Estudio Jurídico Integral · Penal · Familia · Laboral</p>
          </td>
        </tr>
      </table>
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
