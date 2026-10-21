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

// Contact form: se envía por mail vía FormSubmit (ver comentario en index.html), sin JS extra.

// Dropzone de documentación adjunta.
// FormSubmit no adjunta de forma confiable con un solo input "multiple": hay que
// repartir cada archivo en su propio input (attachment, attachment2, ...).
const dropzone = document.getElementById('dropzone');
const dropzoneInput = document.getElementById('adjuntos-input');
const dropzoneFileList = document.getElementById('dropzone-filelist');
const dropzoneHiddenInputs = [
  document.getElementById('attachment-1'),
  document.getElementById('attachment-2'),
  document.getElementById('attachment-3'),
  document.getElementById('attachment-4'),
  document.getElementById('attachment-5'),
];
if (dropzone && dropzoneInput && dropzoneFileList && dropzoneHiddenInputs[0]) {
  const assignFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, dropzoneHiddenInputs.length);
    dropzoneHiddenInputs.forEach((input, i) => {
      const dt = new DataTransfer();
      if (files[i]) dt.items.add(files[i]);
      input.files = dt.files;
    });
    dropzoneFileList.innerHTML = '';
    files.forEach(file => {
      const li = document.createElement('li');
      li.textContent = file.name;
      dropzoneFileList.appendChild(li);
    });
    if (fileList.length > dropzoneHiddenInputs.length) {
      const li = document.createElement('li');
      li.textContent = `+${fileList.length - dropzoneHiddenInputs.length} sin incluir (máx. ${dropzoneHiddenInputs.length})`;
      dropzoneFileList.appendChild(li);
    }
  };
  dropzoneInput.addEventListener('change', () => assignFiles(dropzoneInput.files));
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
      assignFiles(e.dataTransfer.files);
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
