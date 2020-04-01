var slider = document.getElementById("player__bet--input");
var output = document.getElementById("player__bet--amount");
output.innerHTML = slider.value;

slider.oninput = function() {
  output.innerHTML = this.value;
}