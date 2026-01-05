//  safety-check.js | Author: Anmol | Integrated by Alan Fogel

// API base URL
const API_BASE = '/api/newsletter';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSubscribeForm();
    loadCityAreas();
});

function initializeSubscribeForm() {
    const form = document.getElementById('subscribeForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('message');

    if (!form) {
        console.error('Subscribe form not found!');
        return;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Basic client-side validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Validate city areas selection
      const cityAreasSelect = document.getElementById('cityAreas');
      const selectedAreas = Array.from(cityAreasSelect.selectedOptions).map(option => option.value);
      
      if (selectedAreas.length > 10) {
        showMessage('Please select maximum 10 city areas', 'error');
        return;
      }

      // Prepare form data
      const data = {
        name: document.getElementById('name').value.trim(),
        surname: document.getElementById('surname').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        cityAreas: selectedAreas
      };

      // Show loading state
      setLoadingState(true, submitBtn);
      clearMessage(messageDiv);

      try {
        const response = await fetch(`${API_BASE}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.success) {
          showMessage(result.message || 'Successfully subscribed! Welcome to our newsletter.', 'success');
          form.reset();
          
          // Show additional confirmation after success
          setTimeout(() => {
                showMessage('Thank you for subscribing! Please follow the confirmation link in your email.', 'info');
            }, 2000);
        } else {
            showMessage(result.message || 'Subscription failed. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Subscription error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
      } finally {
        setLoadingState(false, submitBtn);
      }
    });

    // Validation for username
    document.getElementById('username').addEventListener('input', function(e) {
        const value = e.target.value;
        const alphanumeric = /^[a-zA-Z0-9]*$/;
        
        if (!alphanumeric.test(value)) {
            e.target.setCustomValidity('Username can only contain letters and numbers');
        } else {
            e.target.setCustomValidity('');
        }
    });

    // City areas selection limit
    document.getElementById('cityAreas').addEventListener('change', function(e) {
        const selectedOptions = e.target.selectedOptions;
        if (selectedOptions.length > 10) {
            alert('Maximum 10 city areas allowed. Please deselect some areas.');
            // Deselect the last selected option
            selectedOptions[selectedOptions.length - 1].selected = false;
        }
    });

    // Form field enhancements
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('invalid', function() {
            this.style.borderColor = '#e74c3c';
        });
        
        input.addEventListener('input', function() {
            this.style.borderColor = '#e1e8ed';
        });
    });
}

async function loadCityAreas() {
    try {
        const response = await fetch(`${API_BASE}/city-areas`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('cityAreas');
            select.innerHTML = ''; // Clear existing options
            
            data.cityAreas.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                option.textContent = area;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load city areas:', error);
        showMessage('Failed to load city areas. Please refresh the page.', 'error');
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

function clearMessage(messageDiv) {
    messageDiv.className = 'message';
    messageDiv.textContent = '';
}

function setLoadingState(isLoading, button) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Subscribing';
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.textContent = 'Subscribe Now';
        button.classList.remove('loading');
    }
}

// Make functions available globally if needed
window.showMessage = showMessage;
window.clearMessage = clearMessage;