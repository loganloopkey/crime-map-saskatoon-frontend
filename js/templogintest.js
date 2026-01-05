
// test to see if logged in or out when accessing another page
// add below div to any page and the js as script to any page 
// and you can see if you're logged in or not when accessing it


// <div class="log-in-test-on-resources-page"></div>



if (sessionStorage.getItem("user-email")){
    document.getElementsByClassName("log-in-test-on-resources-page")[0].innerHTML = "Welcome, "+ sessionStorage.getItem("user-email")+ "!";
}
else {
    document.getElementsByClassName("log-in-test-on-resources-page")[0].innerHTML = "You are not logged in";

}
