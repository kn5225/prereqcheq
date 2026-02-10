const VefifMode = document.getElementById("VerifMode");
VerifMode.addEventListener("click",VerMode);
const ReccomMode = document.getElementById("ReccomMode");
ReccomMode.addEventListener("click",RecMode);

function VerMode() {
  OldContent = document.getElementById("MainArea");
  OldContent.innerHTML = "";
  var input=document.createElement("input");
  input.type = "text";
  input.id="VerInput";
  var button=document.createElement("button");
  button.type="button";
  button.id="VerModeSubmit";
  button.innerText="Submit";
  const element2 = document.getElementById("MainArea");
  element2.appendChild(input);
  element2.appendChild(button);
  const element3=document.getElementById("VerModeSubmit");
  element3.addEventListener("click", VerModeAccept);
}

function VerModeAccept() {
  const VerInpResult = document.getElementById("VerInput");
  var VerClass = VerInpResult.value;
  var VerValues = VerClass.split(" ");
  const url = "https://www.coursicle.com/umass/courses/" + VerValues[0]+ "/" + VerValues[1]+ "/";
  window.open(url);
}
