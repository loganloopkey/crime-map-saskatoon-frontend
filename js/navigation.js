
//Author Finch Nygren
//changes navigation log in/out tab depending on whether user is logged in or out

document.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("user-email")) {
        const loginLink = document.getElementById("log-in-nav-tab");
        loginLink.href = "log-out.html";
        loginLink.textContent = "Log Out";
    }else{
        const loginLink = document.getElementById("log-in-nav-tab");
        loginLink.href = "log-in.html";
        loginLink.textContent = "Log In";
    }
});
    
