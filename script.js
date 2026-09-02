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

  const payload = {
    wave_id: selectedWave,
    student_id: selectedStudentId,
    preferences: preferences
  };

  const scriptURL = 'https://script.google.com/macros/s/AKfycbyC0f5f1oVLCZeTUzp49ticE3yA0QiqDskrOY-knMLGIgVIf7tWEwxgtvnT__HDH-xfZA/exec';

  // Send request using standard text/plain to prevent CORS preflight blockage
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
      alert('Backend Error: ' + responseText);
    }
  })
  .catch(error => {
    console.error('Submission error:', error);
    alert('Failed to connect to Google Sheets. Check browser console (F12).');
  });
});
