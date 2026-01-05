
//author Finch Nygren

// 3 segments - sign in only, log in only, and then shared logic.

// ========================================================================================
// SIGN IN PAGE LOGIC STARTS
// ========================================================================================

if (document.title == "Sign Up") {
    var signUpFormID = document.getElementById('sign-up-form');
    const signUpBtn = document.getElementById('submit-btn-signup');
    const errorMessageDiv = document.getElementById('errorMessage')

    signUpFormID.addEventListener('submit', async (event) => {

        //stop page from reloading
        event.preventDefault(); 

        try {

            //gather info from form to send to processing (will want to add some amount of validation maybe later?)
            const givenEmail = document.getElementById('user-email-signup').value;
            const givenPass = document.getElementById('user-password-signup').value;
            const givenID = crypto.randomUUID();

            //makes HTTP post request with a JSON body that app.js reads from req.body
            // must be api/public.profiles to match app.js (and not confuse post call)
            const response = await fetch('http://localhost:5000/api/public.profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: givenID,
                    email: givenEmail,
                    password: givenPass })
            });


            console.log('got response');

            //reads JSON response from backend, if successful edits what page shows and logs into session
            if (!response.ok){
                console.error('server returned error: ', response.status);
                var text = await response.text();
                console.log('Error response: ',text);
                errorMessageDiv.style.display = 'block'; 
                return;
            }else{
                const data = await response.json();
                sessionStorage.setItem("user-email", givenEmail);
                signUpFormID.style.display = 'none';
                errorMessageDiv.style.display = 'none';
                document.getElementsByClassName("logged-in-message")[0].innerHTML = "Welcome, "+ sessionStorage.getItem("user-email")+ "!";

                const loginLink = document.getElementById("log-in-nav-tab");
                loginLink.href = "log-out.html";
                loginLink.textContent = "Log Out";   
            }

        } catch (e) {console.log('Error trying to send info from form. Error: ', e) };
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("user-email") && (document.title == "Sign Up")) {
        const loginLink = document.getElementById("log-in-nav-tab");
        loginLink.href = "log-out.html";
        loginLink.textContent = "Log Out";

        signUpFormID.style.display = 'none';
        document.getElementsByClassName("logged-in-message")[0].innerHTML = "Welcome, "+ sessionStorage.getItem("user-email")+ "!";
    }
});

// ========================================================================================
// SIGN IN PAGE LOGIC ENDS. LOG IN PAGE LOGIC STARTS
// ========================================================================================


if (document.title == "Log In") {
    var logInFormID = document.getElementById('log-in-form');
    const logInBtn = document.getElementById('submit-btn-log-in');
    const errorMessageDiv = document.getElementById('errorMessage')


    logInFormID.addEventListener('submit', async (event) => {

        //stop page from reloading
        event.preventDefault(); 

        try {

            //gather info from form to send to processing (will want to add some amount of validation maybe later?)
            const givenEmail = document.getElementById('log-in-user-email').value;
            const givenPass = document.getElementById('log-in-user-password').value;

            //makes HTTP post request with a JSON body that app.js reads from req.body (does not need ID) 
            // must be api/profiles to match app.js (and not confuse post call)
            const response = await fetch('http://localhost:5000/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: givenEmail,
                    password: givenPass })
            });

            console.log('got response');

            //reads JSON response from backend, if successful edits what page shows and logs into session
            if (!response.ok){
                console.error('server returned error: ', response.status);
                var text = await response.text();
                console.log('Error response: ',text);
                errorMessageDiv.style.display = 'block'; 
                return;
            }else{
            const data = await response.json();
            if (!data.success) {
                errorMessageDiv.style.display = 'block'; 
                return;
            }

            sessionStorage.setItem("user-email", givenEmail);
            logInFormID.style.display = 'none';
            errorMessageDiv.style.display = 'none'; 
            document.getElementsByClassName("logged-in-message")[0].innerHTML = "Welcome, "+ sessionStorage.getItem("user-email")+ "!";
            
            const loginLink = document.getElementById("log-in-nav-tab");
            loginLink.href = "log-out.html";
            loginLink.textContent = "Log Out";   

            }
        } catch (e) {console.log('Error trying to send info from form. Error: ', e) };
    });
}

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("user-email") && (document.title == "Log In")) {
        const loginLink = document.getElementById("log-in-nav-tab");
        loginLink.href = "log-out.html";
        loginLink.textContent = "Log Out";

        logInFormID.style.display = 'none';
        document.getElementsByClassName("logged-in-message")[0].innerHTML = "Welcome, "+ sessionStorage.getItem("user-email")+ "!";
    }
});



// ========================================================================================
// LOG IN PAGE LOGIC ENDS. THE REST IS SHARED BETWEEN PAGES
// ========================================================================================


/** For checking if input is in the format of an email before insertion into table.
 * params: userInput: input gathered from a forms email input field.
 * output: Boolean: true if valid email format. */
function checkUserInput_Email(userInput) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(userInput);
}


const emailInputField = document.getElementsByClassName('user-email')[0];
const emailInvalidMsg = document.getElementsByClassName('invalid-email-message')[0];

const passInputField = document.getElementsByClassName('user-password')[0];
const passInvalidMsg = document.getElementsByClassName('invalid-pass-message')[0];

const submitBtn = document.getElementsByClassName('login-n-signup-btns')[0];

const targetCharacterCountPassword = 6;

let emailValid = false;
let passwordValid = false;

/* Controllers for email and password input form validity. 
 * Makes message appear below input box when not valid and dissapear when valid. 
 * Sends boolean to allow Submition. */

emailInputField.addEventListener('blur', () => {
    if (!checkUserInput_Email(emailInputField.value)) {
        emailInvalidMsg.innerHTML= "Please enter a valid email format." ;
        emailValid = false;
        submitCheck();

    }else { 
        emailInvalidMsg.innerHTML= "" ;
        emailValid = true;
        submitCheck(); 
    }
});

emailInputField.addEventListener('input', (event) => {
    if (checkUserInput_Email(event.target.value)) {
        emailValid = true;
        submitCheck();
        emailInvalidMsg.innerHTML= "";
    }
});

passInputField.addEventListener('blur', () => {
    if (passInputField.value.length < targetCharacterCountPassword) {
        passInvalidMsg.innerHTML= "Password must be at least "+targetCharacterCountPassword+" characters long." ;
        passwordValid = false;
        submitCheck();

    }else  { 
        passInvalidMsg.innerHTML= "" ;
        passwordValid = true;
        submitCheck(); 
    }
});

passInputField.addEventListener('input', (event) => {
    const currentCharCountPassword = event.target.value.length;
    if (currentCharCountPassword >= targetCharacterCountPassword) {
        passwordValid = true;
        submitCheck();
        passInvalidMsg.innerHTML= "" ;
    }
});

/** 
 * Controlss whether the button is available on the Log In and Sign Up pages
 * Controlled by event listeners
*/
function submitCheck() {
    if (emailValid && passwordValid){
        submitBtn.disabled = false;
    } else { submitBtn.disabled = true; }
}
