const params = new URLSearchParams(window.location.search);
const email = params.get('email');

async function loadStudent() {
    if (!email) {
        document.getElementById('student-details').innerHTML = '<p>Invalid access. No email provided.</p>';
        return;
    }
    try {
        const res = await fetch(`http://localhost:8000/student/${email}`);
        if (!res.ok) {
            document.getElementById('student-details').innerHTML = '<p>Student not found.</p>';
            return;
        }
        const student = await res.json();
        document.getElementById('student-details').innerHTML = `
            <p><strong>Roll No:</strong> ${student.id}</p>
            <p><strong>Name:</strong> ${student.name}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Gender:</strong> ${student.gender}</p>
            <p><strong>Department:</strong> ${student.department}</p>
            <p><strong>Year:</strong> ${student.year}</p>
            <p><strong>Quota:</strong> ${student.quota}</p>
            <p><strong>Batch:</strong> ${student.batch}</p>
        `;
    } catch (err) {
        document.getElementById('student-details').innerHTML = '<p>Error loading student details.</p>';
        console.error('Error:', err);
    }
}

async function loadMarks() {
    if (!email) {
        document.getElementById('marksTableBody').innerHTML = '<tr><td colspan="2">Invalid access. No email provided.</td></tr>';
        return;
    }
    try {
        const res = await fetch(`http://localhost:8000/student/${email}`);
        if (!res.ok) {
            document.getElementById('marksTableBody').innerHTML = '<tr><td colspan="2">Student not found.</td></tr>';
            return;
        }
        const student = await res.json();
        const marksRes = await fetch(`http://localhost:8000/admin/marks/${student.id}`);
        if (!marksRes.ok) {
            document.getElementById('marksTableBody').innerHTML = '<tr><td colspan="2">No marks found.</td></tr>';
            return;
        }
        const marks = await marksRes.json();
        document.getElementById('marksTableBody').innerHTML = `
            <tr><td>Software Engineering</td><td>${marks.software_engineering || 0}</td></tr>
            <tr><td>Computer Networks</td><td>${marks.computer_networks || 0}</td></tr>
            <tr><td>Compiler Design</td><td>${marks.compiler_design || 0}</td></tr>
            <tr><td>JavaScript Framework</td><td>${marks.javascript_framework || 0}</td></tr>
            <tr><td>Cloud Computing</td><td>${marks.cloud_computing || 0}</td></tr>
            <tr><td>Web Technology Laboratory</td><td>${marks.web_technology_lab || 0}</td></tr>
            <tr><td>Computer Networks Laboratory</td><td>${marks.computer_networks_lab || 0}</td></tr>
            <tr><td>Compiler Design Laboratory</td><td>${marks.compiler_design_lab || 0}</td></tr>
            <tr><td><strong>Average Marks</strong></td><td><strong>${marks.average_marks || 0}</strong></td></tr>
        `;
    } catch (err) {
        document.getElementById('marksTableBody').innerHTML = '<tr><td colspan="2">Error loading marks.</td></tr>';
        console.error('Error:', err);
    }
}

async function loadAttendance() {
    if (!email) {
        document.getElementById('attendanceTableBody').innerHTML = '<tr><td colspan="2">Invalid access. No email provided.</td></tr>';
        return;
    }
    try {
        const res = await fetch(`http://localhost:8000/student/${email}`);
        if (!res.ok) {
            document.getElementById('attendanceTableBody').innerHTML = '<tr><td colspan="2">Student not found.</td></tr>';
            return;
        }
        const student = await res.json();
        const percentageRes = await fetch(`http://localhost:8000/admin/attendance_percentage/${student.id}`);
        if (!percentageRes.ok) {
            document.getElementById('attendanceTableBody').innerHTML = '<tr><td colspan="2">No attendance records found.</td></tr>';
            return;
        }
        const percentages = await percentageRes.json();
        const tableBody = document.getElementById('attendanceTableBody');
        tableBody.innerHTML = '';
        const subjects = [
            'Software Engineering',
            'Computer Networks',
            'Compiler Design',
            'JavaScript Framework',
            'Cloud Computing',
            'Web Technology Lab',
            'Computer Networks Lab',
            'Compiler Design Lab'
        ];
        subjects.forEach((subject, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${subject}</td>
                <td>${percentages[`sub${index + 1}`]}%</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        document.getElementById('attendanceTableBody').innerHTML = '<tr><td colspan="2">Error loading attendance records.</td></tr>';
        console.error('Error:', err);
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('error');
    errorEl.textContent = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
        errorEl.textContent = 'Please fill all fields.';
        return;
    }
    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'New password and confirm password do not match.';
        return;
    }
    if (newPassword.length < 6) {
        errorEl.textContent = 'New password must be at least 6 characters long.';
        return;
    }

    try {
        const res = await fetch('http://localhost:8000/change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        if (res.ok) {
            alert('Password updated successfully.');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const data = await res.json();
            errorEl.textContent = data.detail || 'Failed to update password.';
        }
    } catch (err) {
        errorEl.textContent = 'Server error. Please try again later.';
        console.error('Error:', err);
    }
}

function logout() {
    localStorage.removeItem('loggedInEmail');
    window.location.href = 'index.html';
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const buttons = document.querySelectorAll('.sidebar button');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(id)) {
            btn.classList.add('active');
        }
    });
    document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (id === 'dashboard') {
        loadStudent();
    } else if (id === 'marks') {
        loadMarks();
    } else if (id === 'attendance') {
        loadAttendance();
    }
}

window.onload = function () {
    showSection('dashboard');
    loadStudent();
};