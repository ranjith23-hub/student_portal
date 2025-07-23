let editingStudentId = null;



async function loadStudents() {
    const res = await fetch('http://localhost:8000/admin/students');
    const students = await res.json();
    const container = document.getElementById('student-item');
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<p>No students found.</p>';
        return;
    }

    students.forEach(student => {
        const div = document.createElement('div');
        div.innerHTML = `<div class="student-card">
    <b>${student.id} - <b>${student.name}</b> (${student.email})</b> - Marks: ${student.marks}
    <button onclick="" class="stubu">View</button>
    <button onclick="editStudent(${student.id}, '${student.name}', '${student.email}', ${student.marks})">Edit</button>
    <button onclick="deleteStudent(${student.id})">Delete</button>
  </div>
        `;
        div.style.marginBottom = '10px';
        container.appendChild(div);
    });
}

function clearForm() {
    editingStudentId = null;
    document.getElementById('studentId').value = '';
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('marks').value = '';
    document.querySelector('button[onclick="submitStudent()"]').textContent = 'Add Student';
}

function editStudent(id, name, email, marks) {
    editingStudentId = id;
    document.getElementById('studentId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('marks').value = marks;
    document.querySelector('button[onclick="submitStudent()"]').textContent = 'Update Student';
}

async function submitStudent() {
    const id = document.getElementById('id').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const gender = document.getElementById('gender').value;
    const department = document.getElementById('department').value.trim();
    const year = parseInt(document.getElementById('year').value);
    const quota = document.getElementById('quota').value.trim();
    const batch = parseInt(document.getElementById('batch').value);

    if (!id || !name || !email || !gender || !department || isNaN(year) || !quota || isNaN(batch) ) {
        alert("Please fill all fields correctly.");
        return;
    }

    const studentData = {
        id, name, email, gender, department, year, quota, batch
    };

    if (editingStudentId) {
        // Update student (only editable fields)
        const updateData = {
            name, gender, department, year, quota, batch
        };

        const res = await fetch(`http://localhost:8000/admin/update_student/${editingStudentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            alert('Student updated successfully.');
            clearForm();
            loadStudents();
        } else {
            alert('Failed to update student.');
        }
    } else {
        // Add student
        const res = await fetch('http://localhost:8000/admin/add_student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        if (res.ok) {
            alert('Student added successfully.');
            clearForm();
            loadStudents();
        } else {
            alert('Failed to add student (email may already exist).');
        }
    }
}


async function deleteStudent(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    const res = await fetch(`http://localhost:8000/admin/delete_student/${id}`, {
        method: 'DELETE'
    });
    if (res.ok) {
        alert('Student deleted');
        loadStudents();
    } else {
        alert('Failed to delete student');
    }
}

async function fetchTeacher(emailInput) {
  const teacherDetails = document.getElementById("teacherDetails");
  console.log("fetchTeacher called with:", emailInput);  // ✅ this is safe

  try {
    const res = await fetch(
  `http://localhost:8000/api/teachers/by-email/${emailInput}`
);

    if (!res.ok) {
      throw new Error("Teacher not found");
    }
    const teacher = await res.json();
    document.getElementById("tName").innerText = teacher.name;
    document.getElementById("tEmail").innerText = teacher.email;
    document.getElementById("tDepartment").innerText = teacher.department;
    document.getElementById("tSubject").innerText = teacher.subject;
    document.getElementById("tPhone").innerText = teacher.phone;
    document.getElementById("tDOB").innerText = teacher.dob || "N/A";
    document.getElementById("tExperience").innerText = teacher.experience ?? "0";
    document.getElementById("tDOJ").innerText = teacher.date_of_joining || "N/A";
    teacherDetails.style.display = "block";
  } catch (error) {
    alert(error.message);
    teacherDetails.style.display = "none";
  }
}

 function showSection(id) {
      const sections = document.querySelectorAll('.section');
      sections.forEach(section => section.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      if(id=='manageStudent')
      {
            loadStudents();
      }
      else if(id=='dashboard')
      {
            const email = localStorage.getItem('loggedInEmail');
            fetchTeacher(email);
      }
    }
    window.onload=function(){
        const email = localStorage.getItem('loggedInEmail');
        document.getElementById('dashboard').classList.add('active');
        fetchTeacher(email);
    };
