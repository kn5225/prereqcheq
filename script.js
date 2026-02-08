var VefifMode = document.getElementById("VerifMode");
VerifMode.addEventListener(click,VerMode());
var ReccomMode = document.getElementById("ReccomMode");
VerifMode.addEventListener(click,RecMode());

VerMode() {
  var input=document.createElement("input");
  input.type = "text";
  input.id="VerInput";
  var button=document.createElement("button");
  button.type="button"
  button.id="VerModeSubmit"
  button.innerText="Submit"
  var element2 = document.getElementbyId("MainArea");
  element2.appendChild(input);
  element2.appendChild(button);
  var element3=document.getElementById("VerModeSubmit");
  element3.addEventListener(click, VerModeAccept);
}
