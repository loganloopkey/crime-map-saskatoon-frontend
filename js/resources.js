// author Finch Nygren

function searchResources() {

  var input = document.getElementById("resource-search-box");
  var filter = input.value.toUpperCase();
  var list = document.getElementById("resource-box-encasing");
  var listItem = list.getElementsByTagName("li");
  var noMatchText = document.getElementById("no-match");
  var matchFound = false;

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < listItem.length; i++) {
    var websiteTitle = listItem[i].getElementsByTagName("a")[0];
    if (websiteTitle.innerHTML.toUpperCase().indexOf(filter) > -1) {
      listItem[i].style.display = "";
      matchFound = true;
    } else {
      listItem[i].style.display = "none";
    }
  }

  if (matchFound) {
    noMatchText.innerHTML = ""
  }
  else {
    noMatchText.innerHTML = "There was no match found."
  }



}