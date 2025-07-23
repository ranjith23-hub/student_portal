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
        <p><b>Name:</b> ${student.name}</p>
        <p><b>Email:</b> ${student.email}</p>
        <p><b>Marks:</b> ${student.marks}</p>
        <p><b>Grade:</b> ${student.grade}</p>
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
