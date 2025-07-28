let editingStudentId = null;


function loadStudentFromEncoded(encodedData) {
    const student = JSON.parse(decodeURIComponent(encodedData));
    loadStudent(student);
}


async function loadStudent(s) {
    document.getElementById('hello').innerHTML = `
        <div class="student-card">
                <p><strong>Roll No:</strong> ${s.id}</p>
                <p><strong>Name:</strong> ${s.name}</p>
                <p><strong>Email:</strong> ${s.email}</p>
                <p><strong>Gender:</strong> ${s.gender}</p>
                <p><strong>Department:</strong> ${s.department}</p>
                <p><strong>Year:</strong> ${s.year}</p>
                <p><strong>Quota:</strong> ${s.quota}</p>
                <p><strong>Batch:</strong> ${s.batch}</p>
            </div>
    `;
}

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
        const encodedStudent = encodeURIComponent(JSON.stringify(student));
        div.innerHTML = `<div class="student-card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
  <div>
    <b>${student.id} - <b>${student.name}</b></b>
  </div>
  <div>
    <button class="bu" onclick="loadStudentFromEncoded('${encodedStudent}')">View</button>
    <button class="bu" onclick="edit('${student.id}')">Edit</button>
    <button class="bu" onclick="deleteStudent('${student.email}')" style="background-color: red; color: white;">Delete</button>
  </div>
</div>
<hr style="border: 1px solid #ccc; width: 80%;margin-left:10%;">


        `;
        div.style.marginBottom = '10px';
        container.appendChild(div);
    });
}

async function  edit(roll)
{
    showTag("hello");
    document.getElementById("hello").innerHTML="";
    document.getElementById("hello").innerHTML=`
    <h2>EDIT </h2>
    <div style="display: flex; justify-content: space-between; align-items: center;">
    <h3 style="margin: 0;">Roll number - ${roll}</h3>
    <button class="bu" onclick="hideTag('hello')">Close</button>
  </div>
    <label class="la">Name :</label>
    <input class="in" style="text-transform: uppercase;" id="name1" />
    <label class="la">E-mail :</label>
    <input class="in" placeholder="eg : abc@gmail.com" id="email1" style="text-transform: lowercase;" />
    <label class="la">Department :</label>
        <select class="in" id="department1">
          <option value="" disabled selected>Select your department</option>
          <option value="CSE">Computer Science Engineering</option>
          <option value="MECH">Mechanical Engineering</option>
          <option value="CIVIL">Civil Engineering</option>
          <option value="ECE">Electronics and Communication Engineering</option>
          <option value="EEE">Electrical and Electronics Engineering</option>
          <option value="CHEMICAL">Chemical Engineering</option>
          <option value="IT">Information Technology</option>
          <option value="AIDS">Artificial Intelligence and Data Science</option>
        </select>
    <label  class="la" > Year  : </label>
    <input class="in" id="year1" type="number"/>
    <button class="bu" onclick="editStudent('${roll}')"> Submit</button>
    <br>
    <br>
    `;
}

async  function editStudent(roll){
    const name = document.getElementById('name1').value.trim();
    const email = document.getElementById('email1').value.trim();
    const department = document.getElementById('department1').value.trim();
    const year = parseInt(document.getElementById('year1').value); 
     const updateData = {
            name, email, department, year
        };

        const res = await fetch(`http://localhost:8000/admin/update_student/${roll}`, {
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
}
function clearForm() {
    editingStudentId = null;
    document.getElementById('id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('gender').value = '';    
    document.getElementById('department').value = '';    
    document.getElementById('year').value = '';    
    document.getElementById('quota').value = '';    
    document.getElementById('batch').value = '';

    document.querySelector('button[onclick="submitStudent()"]').textContent = 'Add Student';
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

function hideTag(id) {
    document.getElementById(id).style.display = 'none';
}

function showTag(id) {
    document.getElementById(id).style.display = 'block';
}
