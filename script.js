let appData = {};

// 1. Fetch JSON data on page load
fetch('./data.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load JSON');
    return response.json();
  })
  .then(data => {
    appData = data;
  })
  .catch(error => console.error('Error loading data.json:', error));

// DOM Elements
const waveSelect = document.getElementById('waveSelect');
const studentSelect = document.getElementById('studentSelect');
const preferencesContainer = document.getElementById('preferencesContainer');
const preferencesList = document.getElementById('preferencesList');
const preferenceForm = document.getElementById('preferenceForm');

// 2. Step 1 -> Step 2: Handle Wave selection
waveSelect.addEventListener('change', function () {
  const selectedWaveId = parseInt(this.value, 10);

  // Reset student dropdown and preferences
  studentSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
  preferencesContainer.style.display = 'none';

  if (!selectedWaveId || !appData.waves) {
    studentSelect.disabled = true;
    return;
  }

  // Find students belonging to the selected wave
  const waveData = appData.waves.find(w => w.wave_id === selectedWaveId);

  if (waveData && waveData.students) {
    waveData.students.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = student.name; // Shows name only (GPA hidden)
      studentSelect.appendChild(option);
    });
    studentSelect.disabled = false;
  }
});

// 3. Step 2 -> Step 3: Handle Student selection
studentSelect.addEventListener('change', function () {
  if (!this.value) {
    preferencesContainer.style.display = 'none';
    return;
  }

  // Generate department preference dropdowns dynamically
  preferencesList.innerHTML = '';
  const departments = appData.available_departments || [];

  departments.forEach((dept, index) => {
    const div = document.createElement('div');
    div.className = 'pref-group';

    const label = document.createElement('label');
    label.textContent = `Preference ${index + 1}:`;

    const select = document.createElement('select');
    select.name = `pref_${index + 1}`;
    select.required = true;

    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Department --';
    select.appendChild(defaultOption);

    departments.forEach(departmentName => {
      const opt = document.createElement('option');
      opt.value = departmentName;
      opt.textContent = departmentName;
      select.appendChild(opt);
    });

    div.appendChild(label);
    div.appendChild(select);
    preferencesList.appendChild(div);
  });

  preferencesContainer.style.display = 'block';
});

// 4. Handle Form Submission and update Google Sheet
preferenceForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const selectedWave = parseInt(waveSelect.value, 10);
  const selectedStudentId = parseInt(studentSelect.value, 10);

  // Gather selected preferences
  const preferences = [];
  const prefDropdowns = preferencesList.querySelectorAll('select');
  prefDropdowns.forEach(select => preferences.push(select.value));

  // Check for duplicate preferences
  const uniquePrefs = new Set(preferences);
  if (uniquePrefs.size !== preferences.length) {
    alert('Please ensure you do not select the same department twice!');
    return;
  }

  // Find student details from appData
  let studentName = '';
  let studentGpa = null;

  const waveData = appData.waves.find(w => w.wave_id === selectedWave);
  if (waveData && waveData.students) {
    const studentObj = waveData.students.find(s => s.id === selectedStudentId);
    if (studentObj) {
      studentName = studentObj.name;
      studentGpa = studentObj.gpa;
    }
  }

  const payload = {
    wave_id: selectedWave,
    student_id: selectedStudentId,
    student_name: studentName,
    gpa: studentGpa,
    preferences: preferences
  };

  // Google Apps Script Web App URL
  const scriptURL = 'https://script.google.com/macros/s/AKfycbyC0f5f1oVLCZeTUzp49ticE3yA0QiqDskrOY-knMLGIgVIf7tWEwxgtvnT__HDH-xfZA/exec';

  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(() => {
    alert('Preferences submitted successfully!');
    preferenceForm.reset();
    studentSelect.disabled = true;
    preferencesContainer.style.display = 'none';
  })
  .catch(error => {
    console.error('Submission error:', error);
    alert('Failed to submit preferences. Please try again.');
  });
});
