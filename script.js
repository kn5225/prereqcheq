let VefifMode = document.getElementById("VerifMode");
VerifMode.addEventListener("click",VerMode());
let ReccomMode = document.getElementById("ReccomMode");
VerifMode.addEventListener("click",RecMode());

function VerMode() {
  var input=document.createElement("input");
  input.type = "text";
  input.id="VerInput";
  var button=document.createElement("button");
  button.type="button"
  button.id="VerModeSubmit"
  button.innerText="Submit"
  let element2 = document.getElementById("MainArea");
  element2.appendChild(input);
  element2.appendChild(button);
  let element3=document.getElementById("VerModeSubmit");
  element3.addEventListener("click", VerModeAccept);
}
