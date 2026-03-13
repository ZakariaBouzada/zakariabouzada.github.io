/* ============================================
6. Contact Form
============================================ */

function handleContactForm(e) {
    e.preventDefault();
    const btn = document.getElementById('form-btn');
    const status = document.getElementById('form-status');
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const message = document.getElementById('form-message').value;

    btn.disabled = true;
    btn.textContent = 'Sending...';

// Uses Formspree — replace YOUR_FORM_ID with your actual ID from formspree.io
    fetch('https://formspree.io/f/mdalqpjq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
    })
        .then(res => {
            if (res.ok) {
                status.style.display = 'block';
                status.style.color = '#059669';
                status.textContent = '✓ Message sent! I will get back to you soon.';
                e.target.reset();
            } else {
                throw new Error();
            }
        })
        .catch(() => {
            status.style.display = 'block';
            status.style.color = '#dc2626';
            status.textContent = '✗ Something went wrong. Please email me directly.';
        })
        .finally(() => {
            btn.disabled = false;
            btn.textContent = 'Send Message';
        });
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}