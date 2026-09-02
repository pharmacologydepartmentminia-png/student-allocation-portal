let appData = {};

// DOM Elements
const waveSelect = document.getElementById('waveSelect');
const studentSelect = document.getElementById('studentSelect');
const preferencesContainer = document.getElementById('preferencesContainer');
const preferencesList = document.getElementById('preferencesList');
const preferenceForm = document.getElementById('preferenceForm');

// 1. Fetch JSON data on page load
fetch('./data.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load data.json');
    return response.json();
  })
  .then(data => {
    appData = data;
    console.log('data.json successfully loaded:', appData);
  })
  .catch(error => {
    console.error('Error loading data.json:', error);
    alert('Failed to load student data. Please check that data.json is in the same folder.');
  });

// 2. Step 1 -> Step 2: Handle Wave selection
waveSelect.addEventListener('change', function () {
  const selectedWaveId = parseInt(this.value, 10);

  // Reset student dropdown and preferences container
  studentSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
  preferencesContainer.style.display = 'none';

  if (!selectedWaveId || !appData.waves) {
    studentSelect.disabled = true;
    return;
  }

  // Find students belonging to the selected wave
  const waveData = appData.waves.find(w => w.wave_id === selectedWaveId);

  if (waveData && waveData.students && waveData.students.length > 0) {
    waveData.students.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = student.name; // Shows student name (GPA remains hidden)
      studentSelect.appendChild(option);
    });
    
    // Enable the student dropdown menu
    studentSelect.disabled = false;
  } else {
    studentSelect.disabled = true;
    alert('No students found for the selected wave.');
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

  if (departments.length === 0) {
    alert('No departments found in data.json!');
    return;
  }

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

// 4. Handle Form Submission and send payload to Google Sheets
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

  const payload = {
    wave_id: selectedWave,
    student_id: selectedStudentId,
    preferences: preferences
  };

  const scriptURL = 'https://script.google.com/macros/s/AKfycbyC0f5f1oVLCZeTUzp49ticE3yA0QiqDskrOY-knMLGIgVIf7tWEwxgtvnT__HDH-xfZA/exec';

  fetch(scriptURL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(response => response.text())
  .then(responseText => {
    console.log('Server Response:', responseText);
    
    if (responseText.includes('Successfully updated') || responseText.includes('Success')) {
      alert('Preferences submitted successfully!');
      preferenceForm.reset();
      studentSelect.disabled = true;
      preferencesContainer.style.display = 'none';
    } else {
      alert('Backend Response: ' + responseText);
    }
  })
  .catch(error => {
    console.error('Submission error:', error);
    alert('Failed to connect to Google Sheets. Please check your connection.');
  });
});
