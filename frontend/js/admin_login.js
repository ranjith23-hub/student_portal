document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error');
    errorEl.textContent = '';

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const res = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        body: formData
    });

    if (res.ok) {
        window.location.href = 'admin.html';
    } else {
        const data = await res.json();
        errorEl.textContent = data.detail || 'Login failed';
    }
});
