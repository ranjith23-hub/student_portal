async function login(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    localStorage.setItem('loggedInEmail', email);

    const password = document.getElementById('pass').value;
    const errorEl = document.getElementById('error');
    errorEl.textContent = '';

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
        const res = await fetch('http://localhost:8000/login', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            if (data.role === "admin") {
                window.location.href = 'admin.html';
            } else if (data.role === "student") {
                
                window.location.href = `student_dashboard.html?email=${encodeURIComponent(email)}`;
            }
        } else {
            errorEl.textContent = data.detail || "Login failed";
        }
    } catch (err) {
        errorEl.textContent = "Server error. Please try again later.";
    }

}
