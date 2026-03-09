import { createClient } from "https://esm.sh/@supabase/supabase-js"

const supabase = createClient("https://dfzsfjcmtxvgotzpdagy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenNmamNtdHh2Z290enBkYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTA4NDUsImV4cCI6MjA4ODA2Njg0NX0.sZgZzPYVa1iwV1wGH3eS0u9hssoTzZrZPXk7_w11Yc0")

const VerifMode = document.getElementById("VerifMode");
VerifMode.addEventListener("click",VerMode);
const ReccomMode = document.getElementById("ReccomMode");
ReccomMode.addEventListener("click",RecMode);
console.log("adding admin listener")
console.log(document.getElementById("AdminMode"))
const AdminMode = document.getElementById("AdminMode");
AdminMode.addEventListener("click",AdmMode);

const ButtonHTML=document.getElementById("buttonarea").innerHTML;
function VerMode() {
  let OldContent = document.getElementById("MainArea");
  OldContent.innerHTML = "";
  var input=document.createElement("input");
  input.type = "text";
  input.id="VerInput";
  input.placeholder="Enter course..."
  var button=document.createElement("button");
  button.type="button";
  button.id="VerModeSubmit";
  button.innerText="Submit";
  const element2 = document.getElementById("MainArea");
  const checkBoxDiv = document.createElement("div")
  checkBoxDiv.id="checkBoxDiv"
  element2.appendChild(input);
  element2.appendChild(button);
  element2.appendChild(checkBoxDiv);
  const VerSubmit=document.getElementById("VerModeSubmit");
  VerSubmit.addEventListener("click", VerModeAccept);
}

async function VerModeAccept() {
  const VerInpResult = document.getElementById("VerInput");
  var VerClass = VerInpResult.value;
  let OldContent = document.getElementById("checkBoxDiv");
  OldContent.innerHTML = "";
  const { data, error } = await supabase
    .from("prereqlookup")
    .select("*")
    .eq("COURSE", VerClass)
  if (error) {
  console.error(error)
  return
  }
  
  const element2 = document.getElementById("MainArea");
  const course = data[0];
  const prerequisites = course.PREREQS.prerequisites;
  
  prerequisites.forEach((group, index) => {
  const CheckBoxDiv = document.getElementById("checkBoxDiv");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `group-${index}`;

  const label = document.createElement("label");
  label.htmlFor = `group-${index}`;
  label.textContent = group.join(" OR ");
  const br = document.createElement("br");
  CheckBoxDiv.appendChild(checkbox);
  CheckBoxDiv.appendChild(label);
  CheckBoxDiv.appendChild(br); 
          })

  VerModeMet()
}

function VerModeMet() {
  const checkButton = document.createElement("button")
  checkButton.textContent = "Check Prerequisites"
  const result = document.createElement("p")
  result.id = "prereqResult"
  checkButton.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll("#checkBoxDiv input[type='checkbox']")
    const allMet = [...checkboxes].every(cb => cb.checked)
    result.textContent = allMet ? "Prerequisites met" : "Prerequisites not met"
  })
  
  const CheckBoxDiv = document.getElementById("checkBoxDiv");
  CheckBoxDiv.appendChild(checkButton)
  CheckBoxDiv.appendChild(result)
}
function RecMode() {
  
}
function AdmMode() {
  let OldContent = document.getElementById("MainArea");
  OldContent.innerHTML = "";
  var input1=document.createElement("input");
  input1.type = "email";
  input1.id="AdmInputEmail";
  input1.placeholder="Enter email...";
  var input2=document.createElement("input");
  input2.type = "password";
  input2.id="AdmInputPassword";
  input2.placeholder="Enter password...";
  var button=document.createElement("button");
  button.type="button";
  button.id="AdmModeSubmit";
  button.innerText="Submit";
  const element2 = document.getElementById("MainArea");
  element2.appendChild(input1);
  element2.appendChild(br);
  element2.appendChild(input2);
  element2.appendChild(br);
  element2.appendChild(button);
  const AdmSubmit=document.getElementById("AdmModeSubmit");
  AdmSubmit.addEventListener("click",AdmModeAccept)
}

async function AdmModeAccept() {
  const email = document.getElementById("AdmInputEmail").value
  const password = document.getElementById("AdmInputPassword").value

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.log("error")
    return
  }
  console.log("Logged in")
  AdmModeAdd()
}

function AdmModeAdd(){
  let OldContent1= document.getElementById("ButtonArea");
  OldContent1.innerHTML = "";
  let OldContent2= document.getElementById("MainArea");
  OldContent2.innerHTML = "";
  
  var input3=document.createElement("input");
  input3.type = "text";
  input3.id="AdmAddCourse";
  input3.placeholder="Enter course (Eg. ECE 213)";
  var input2=document.createElement("input");
  input2.type = "text";
  input2.id="AdmAddPrereqs";
  input2.placeholder="Enter prerequisites (Eg. [['MATH 132','PHYSICS 151'],['CS 187']]";
  var button=document.createElement("button");
  button.type="button";
  button.id="AdmAddSubmit";
  button.innerText="Submit";
  const br = document.createElement("br");
  const element2 = document.getElementById("MainArea");
  element2.appendChild(input1);
  element2.appendChild(br);
  element2.appendChild(input2);
  element2.appendChild(br);
  element2.appendChild(button);
  const AdmAddSubmit=document.getElementById("AdmAddSubmit");
  AdmAddSubmit.addEventListener("click",AdmAddAccept)
}

function AdmAddAccept(){

}
