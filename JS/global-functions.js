//Id = id of element in html, toggles display between "none" and the input display
export function toggleDisplayNone(id, display){
    let element = document.getElementById(id);
    if (element.style.display === "none") {
        element.style.display = display;
    } else {
        element.style.display = "none";
    }
}

// function toggleBodyFormOpen(){
//     if (document.body.classList.contains("form-open")) {
//         document.body.classList.remove("form-open");
//     } else {
//         document.body.classList.add("form-open");
//     }
// }

export function writeLoginError(error){
    document.getElementById("login__container--error").innerHTML = error;
}

export function writeRegisterError(error){
    document.getElementById("register__container--error").innerHTML = error;
}