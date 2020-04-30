let host = "localhost",
    port = 3000;

let websocket = new WebSocket(`ws://${host}:${port}/`);

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }