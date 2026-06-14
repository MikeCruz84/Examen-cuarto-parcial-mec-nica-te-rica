document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('exam-form');
    const textareas = document.querySelectorAll('#section-open textarea');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const btnSubmit = document.getElementById('btn-submit');
    const pasteField = document.getElementById('paste-detected');
    const timestampField = document.getElementById('timestamp');

    let examDisabled = false;

    // Temporizador del examen (1 hora 20 minutos)
    const EXAM_DURATION = 80 * 60;
    let timeRemaining = EXAM_DURATION;
    const timerBar = document.getElementById('timer-bar');
    const timerDisplay = document.getElementById('timer-display');

    function startTimer() {
        timerBar.classList.remove('hidden');
        const interval = setInterval(function () {
            timeRemaining--;
            const h = Math.floor(timeRemaining / 3600);
            const m = Math.floor((timeRemaining % 3600) / 60);
            const s = timeRemaining % 60;
            timerDisplay.textContent =
                String(h).padStart(2, '0') + ':' +
                String(m).padStart(2, '0') + ':' +
                String(s).padStart(2, '0');
            if (timeRemaining <= 300) {
                timerBar.classList.add('warning');
            }
            if (timeRemaining <= 0) {
                clearInterval(interval);
                timestampField.value = new Date().toLocaleString('es-MX');
                form.submit();
            }
        }, 1000);
    }

    // Lógica para revelar examen tras ingresar nombre
    const btnStart = document.getElementById('btn-start');
    const sectionMC = document.getElementById('section-mc');
    const sectionOpen = document.getElementById('section-open');
    const submitSection = document.querySelector('.submit-section');

    btnStart.addEventListener('click', function () {
        const nombre = document.getElementById('nombre').value.trim();
        if (!nombre) {
            alert('Por favor, escribe tu nombre para continuar.');
            return;
        }
        btnStart.classList.add('hidden');
        sectionMC.classList.remove('hidden');
        sectionOpen.classList.remove('hidden');
        submitSection.classList.remove('hidden');
        startTimer();
    });

    // Detección de paste en textareas de preguntas abiertas
    textareas.forEach(function (textarea) {
        textarea.addEventListener('paste', function (e) {
            e.preventDefault();
            handlePasteDetected();
        });
    });

    function handlePasteDetected() {
        examDisabled = true;
        pasteField.value = 'SI - INTENTO DE COPIA DETECTADO';

        modalOverlay.classList.remove('hidden');

        textareas.forEach(function (ta) {
            ta.disabled = true;
        });
        btnSubmit.disabled = true;

        sendPasteNotification();
    }

    function sendPasteNotification() {
        const nombre = document.getElementById('nombre').value || 'No proporcionado';

        const data = new FormData();
        data.append('nombre', nombre);
        data.append('paste_detectado', 'SI - INTENTO DE COPIA DETECTADO');
        data.append('timestamp', new Date().toLocaleString('es-MX'));
        data.append('_subject', 'ALERTA: Intento de copia en examen - ' + nombre);

        fetch(form.action, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
        });
    }

    modalClose.addEventListener('click', function () {
        modalOverlay.classList.add('hidden');
    });

    // Validación y envío del formulario
    form.addEventListener('submit', function (e) {
        if (examDisabled) {
            e.preventDefault();
            modalOverlay.classList.remove('hidden');
            return;
        }

        timestampField.value = new Date().toLocaleString('es-MX');

        const nombre = document.getElementById('nombre').value.trim();

        if (!nombre) {
            e.preventDefault();
            alert('Por favor, completa tu nombre antes de enviar.');
            return;
        }

        const radios = ['mc1', 'mc2', 'mc3', 'mc4'];
        for (let i = 0; i < radios.length; i++) {
            const selected = document.querySelector('input[name="' + radios[i] + '"]:checked');
            if (!selected) {
                e.preventDefault();
                alert('Por favor, responde todas las preguntas de opción múltiple (Pregunta ' + (i + 1) + ' sin responder).');
                return;
            }
        }

        for (let i = 0; i < textareas.length; i++) {
            if (!textareas[i].value.trim()) {
                e.preventDefault();
                alert('Por favor, responde todas las preguntas abiertas (Pregunta ' + (i + 5) + ' sin responder).');
                return;
            }
        }
    });

    // Bloquear copiado de texto en toda la página (silencioso)
    document.addEventListener('copy', function (e) { e.preventDefault(); });
    document.addEventListener('cut', function (e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'u')) {
            e.preventDefault();
        }
    });

    // Agregar subject para el email
    const subjectInput = document.createElement('input');
    subjectInput.type = 'hidden';
    subjectInput.name = '_subject';
    subjectInput.value = 'Respuesta de Examen - Marcos No Inerciales';
    form.appendChild(subjectInput);
});
