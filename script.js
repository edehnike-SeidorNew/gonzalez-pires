document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu toggle
const header = document.getElementById('header');
const burger = document.getElementById('burger');
burger.addEventListener('click', () => {
  header.classList.toggle('open');
});
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => header.classList.remove('open'));
});

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Contact form
const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const nombre = data.get('nombre');
  const area = data.get('area') || 'Consulta general';
  const detalle = data.get('detalle') || '';
  const telefono = data.get('telefono');

  const mensaje = `Hola, soy ${nombre}. Quisiera una consulta sobre: ${area}. Mi teléfono es ${telefono}. Detalle: ${detalle}`;
  const url = `https://wa.me/5491167894327?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
});

// WhatsApp QR code (mismo número que el botón)
const qrContainer = document.getElementById('qr-code');
if (qrContainer && window.QRCode) {
  new QRCode(qrContainer, {
    text: 'https://wa.me/5491167894327',
    width: 140,
    height: 140,
    colorDark: '#1c2135',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}
