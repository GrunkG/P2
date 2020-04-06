//Id = id of element in html, toggles display between "none" and the input display
function toggleDisplayNone(id, display){
    let element = document.getElementById(id);
    if (element.style.display === "none") {
        element.style.display = display;
    } else {
        element.style.display = "none";
    }
}