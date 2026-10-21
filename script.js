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

// Contact form: envía por una Netlify Function propia (netlify/functions/send-consultation.js)
// que usa Resend, así el mail sale con el diseño de la marca y sin los límites de
// adjuntos de FormSubmit/EmailJS free. Ver comentario en index.html.
const dropzone = document.getElementById('dropzone');
const dropzoneInput = document.getElementById('adjuntos-input');
const dropzoneFileList = document.getElementById('dropzone-filelist');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const formSubmitBtn = document.getElementById('form-submit-btn');
const MAX_FILES = 5;
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4MB: margen bajo el límite de la function (6MB con el resto del payload)

let selectedFiles = [];

const renderFileNames = () => {
  dropzoneFileList.innerHTML = '';
  selectedFiles.forEach(file => {
    const li = document.createElement('li');
    li.textContent = file.name;
    dropzoneFileList.appendChild(li);
  });
};

const addFiles = (fileList) => {
  const incoming = Array.from(fileList);
  const skipped = selectedFiles.length + incoming.length - MAX_FILES;
  selectedFiles = [...selectedFiles, ...incoming].slice(0, MAX_FILES);
  renderFileNames();
  if (skipped > 0) {
    const li = document.createElement('li');
    li.textContent = `+${skipped} sin incluir (máx. ${MAX_FILES})`;
    dropzoneFileList.appendChild(li);
  }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const setFormStatus = (message, type) => {
  formStatus.hidden = false;
  formStatus.textContent = message;
  formStatus.className = `form-status form-status-${type}`;
};

if (dropzone && dropzoneInput && dropzoneFileList) {
  dropzoneInput.addEventListener('change', () => addFiles(dropzoneInput.files));
  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  });
}

if (contactForm && formStatus && formSubmitBtn) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      setFormStatus('Los archivos adjuntos pesan demasiado (máx. 4MB en total). Quitá alguno e intentá de nuevo.', 'error');
      return;
    }

    formSubmitBtn.disabled = true;
    formSubmitBtn.textContent = 'ENVIANDO...';

    try {
      const data = new FormData(contactForm);
      const adjuntos = await Promise.all(selectedFiles.map(async file => ({
        name: file.name,
        content: await fileToBase64(file),
      })));

      const res = await fetch('/.netlify/functions/send-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.get('nombre'),
          telefono: data.get('telefono'),
          email: data.get('email'),
          area: data.get('area'),
          detalle: data.get('detalle'),
          adjuntos,
        }),
      });

      if (!res.ok) throw new Error('No se pudo enviar');

      setFormStatus('¡Listo! Recibimos tu consulta, te contactamos a la brevedad.', 'ok');
      contactForm.reset();
      selectedFiles = [];
      renderFileNames();
    } catch (err) {
      setFormStatus('Hubo un error al enviar. Probá de nuevo o escribinos por WhatsApp.', 'error');
    } finally {
      formSubmitBtn.disabled = false;
      formSubmitBtn.textContent = 'ENVIAR MI CONSULTA';
    }
  });
}

// Desplegable de áreas de especialidad
const areasToggle = document.getElementById('areas-toggle');
const areasExtra = document.getElementById('areas-extra');
const areasToggleLabel = areasToggle ? areasToggle.querySelector('.areas-toggle-label') : null;
if (areasToggle && areasExtra && areasToggleLabel) {
  areasToggle.addEventListener('click', () => {
    const isOpen = areasExtra.classList.toggle('open');
    areasExtra.style.maxHeight = isOpen ? areasExtra.scrollHeight + 'px' : null;
    areasToggle.classList.toggle('open', isOpen);
    areasToggle.setAttribute('aria-expanded', isOpen);
    areasToggleLabel.textContent = isOpen ? 'VER MENOS ÁREAS' : 'VER TODAS LAS ÁREAS';
  });
}

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
