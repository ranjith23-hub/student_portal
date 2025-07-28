const params = new URLSearchParams(window.location.search);
const email = params.get('email');

async function loadStudent() {
    if (!email) {
        document.getElementById('student-details').innerHTML = '<p>Invalid access. No email provided.</p>';
        return;
    }
    const res = await fetch(`http://localhost:8000/student/${email}`);
    if (!res.ok) {
        document.getElementById('student-details').innerHTML = '<p>Student not found.</p>';
        return;
    }
    const student = await res.json();

    document.getElementById('student-details').innerHTML = `
        <div class="student-card">
                <p><strong>Roll No:</strong> ${s.id}</p>
                <p><strong>Name:</strong> ${s.name}</p>
                <p><strong>Email:</strong> ${s.email}</p>
                <p><strong>Gender:</strong> ${s.gender}</p>
                <p><strong>Department:</strong> ${s.department}</p>
                <p><strong>Quota:</strong> ${s.quota}</p>
                <p><strong>Batch:</strong> ${s.batch}</p>
            </div>
        <button onclick="downloadPDF()">Download Marksheet (PDF)</button>
    `;
}

function downloadPDF() {
    window.open(`http://localhost:8000/student/${email}/pdf`, '_blank');
}

function logout() {
    window.location.href = 'index.html';
}

window.onload = loadStudent;
