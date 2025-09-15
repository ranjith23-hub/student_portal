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
        const marks = student.marks;
        document.getElementById('marksTableBody').innerHTML = `
            <tr><td>CN</td><td>${marks.cn !== null ? marks.cn : 'N/A'}</td></tr>
            <tr><td>SE</td><td>${marks.se !== null ? marks.se : 'N/A'}</td></tr>
            <tr><td>CD</td><td>${marks.cd !== null ? marks.cd : 'N/A'}</td></tr>
            <tr><td>JS</td><td>${marks.js !== null ? marks.js : 'N/A'}</td></tr>
            <tr><td>Cloud</td><td>${marks.cloud !== null ? marks.cloud : 'N/A'}</td></tr>
            <tr><td><strong>Average Marks</strong></td><td><strong>${calculateAverage(marks)}</strong></td></tr>
        `;
    } catch (err) {
        document.getElementById('marksTableBody').innerHTML = '<tr><td colspan="2">Error loading marks.</td></tr>';
        console.error('Error:', err);
    }
}

function calculateAverage(marks) {
    const validMarks = [marks.cn, marks.se, marks.cd, marks.js, marks.cloud].filter(m => m !== null);
    return validMarks.length > 0 ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(2) : 'N/A';
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
        const roll_no = student.id;
        const attendanceRes = await fetch(`http://localhost:8000/attendance/${roll_no}`);
        if (!attendanceRes.ok) {
            document.getElementById('attendanceTableBody').innerHTML = '<tr><td colspan="2">No attendance records found.</td></tr>';
            return;
        }
        const attendance = await attendanceRes.json();
        const details = attendance.details;
        document.getElementById('attendanceTableBody').innerHTML = `
            <tr><td>CN</td><td>${details.cn.percentage}%</td></tr>
            <tr><td>SE</td><td>${details.se.percentage}%</td></tr>
            <tr><td>CD</td><td>${details.cd.percentage}%</td></tr>
            <tr><td>JS</td><td>${details.js.percentage}%</td></tr>
            <tr><td>Cloud</td><td>${details.cloud.percentage}%</td></tr>
            <tr><td><strong>Overall Attendance</strong></td><td><strong>${attendance.attendance_percentage}%</strong></td></tr>
        `;
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