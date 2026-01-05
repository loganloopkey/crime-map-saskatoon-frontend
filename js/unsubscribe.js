//  unsubscribe.js | Author: Anmol | Integrated by Alan Fogel

// API base URL
const API_BASE = '/api/newsletter';

document.addEventListener('DOMContentLoaded', function() {
    initializeUnsubscribePage();
});

function initializeUnsubscribePage() {
    const confirmBtn = document.getElementById('confirmUnsubscribeBtn');
    const userEmailSpan = document.getElementById('userEmail');

    // In a real app, we would get email from URL parameters
    // For now, simulate it or get from a prompt
    const urlParams = new URLSearchParams(window.location.search);
    let email = urlParams.get('email');
    
    // If no email in URL (direct visit), show a simple form
    if (!email) {
        showEmailInputForm();
        return;
    }

    // Display the email being unsubscribed
    userEmailSpan.textContent = email;
    
    confirmBtn.addEventListener('click', async () => {
        await processUnsubscribe(email, confirmBtn);
    });
}

async function processUnsubscribe(email, button = null) {
    // null check for button
    if (!button) {
        button = document.getElementById("confirmUnsubscribeBtn") || document.querySelector('#emailForm button[type="submit"]');
    }

    setLoadingState(true, button, 'Unsubscribing...', 'Unsubscribe');
    clearMessage(document.getElementById('message'));

    try {
        const response = await fetch(`${API_BASE}/unsubscribe`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (result.success) {
            const confirmationSection = document.getElementById('confirmationSection');
            const successSection = document.getElementById('successSection');

            if (confirmationSection && successSection) {
                confirmationSection.style.display = 'none';
                successSection.style.display = 'block';
            } else {
                // If we're on the email input form, show success message
                showMessage('You have been successfully unsubscribed! You will no longer receive crime update emails.', 'success');

                // Clear the email form
                const emailForm = document.getElementById('emailForm');
                if (emailForm) {
                    emailForm.reset();
                }

            }
        } else {
            showMessage(result.message || 'Unsubscribe failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Unsubscribe error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        setLoadingState(false, button, 'Unsubscribing...', 'Unsubscribe');
    }
}

function showEmailInputForm() {
    const content = document.querySelector('.content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="confirmation-box">
            <h3>Unsubscribe from Updates</h3>
            <p>Enter your email address to unsubscribe from crime alerts:</p>
        </div>
        
        <form id="emailForm">
            <div class="form-group">
                <label for="emailInput">Email Address *</label>
                <input type="email" id="emailInput" name="email" required placeholder="your.email@example.com">
            </div>
            
            <div class="button-group">
                <button type="submit" class="btn-danger" id="formSubmitBtn">Unsubscribe</button>
            </div>
        </form>
        
        <div id="message" class="message"></div>
    `;
    
    // Add event listener to the new form
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('emailInput');
            if (emailInput && emailInput.value) {
                const email = emailInput.value.trim();
                const submitBtn = document.getElementById('formSubmitBtn');
                await processUnsubscribe(email, submitBtn); // Pass the button here
            }
        });
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
        button.textContent = 'Processing...';
    } else {
        button.disabled = true;
        button.textContent = 'Unsubscribed';
    }
}
