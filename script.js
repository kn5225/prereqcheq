import { createClient } from "https://esm.sh/@supabase/supabase-js"

const supabase = createClient("https://dfzsfjcmtxvgotzpdagy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenNmamNtdHh2Z290enBkYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTA4NDUsImV4cCI6MjA4ODA2Njg0NX0.sZgZzPYVa1iwV1wGH3eS0u9hssoTzZrZPXk7_w11Yc0")

const VerifMode = document.getElementById("VerifMode");
VerifMode.addEventListener("click",VerMode);
const ReccomMode = document.getElementById("ReccomMode");
ReccomMode.addEventListener("click",RecMode);
const AdminMode = document.getElementById("AdminMode");
AdminMode.addEventListener("click",AdmMode);

const ButtonArea=document.getElementById("ButtonArea");
const ButtonHTML = ButtonArea.innerHTML;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


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
  const MainArea = document.getElementById("MainArea");
  const checkBoxDiv = document.createElement("div")
  checkBoxDiv.id="checkBoxDiv"
  MainArea.appendChild(input);
  MainArea.appendChild(button);
  MainArea.appendChild(checkBoxDiv);
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
  
  const MainArea = document.getElementById("MainArea");
  if (!data || data.length === 0) {
    const CheckBoxDiv = document.getElementById("checkBoxDiv")
    CheckBoxDiv.innerHTML = "<p>Course not found.</p>"
  }
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
  const MainArea = document.getElementById("MainArea");
  MainArea.appendChild(input1);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(input2);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(button);
  const AdmSubmit=document.getElementById("AdmModeSubmit");
  AdmSubmit.addEventListener("click",AdmModeAccept)
}

async function AdmModeAccept() {
  const email = document.getElementById("AdmInputEmail").value
  const password = document.getElementById("AdmInputPassword").value

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.log("error");
    const errorP = document.createElement("p");
    errorP.textContent = "Invalid credentials"
    document.getElementById("MainArea").appendChild(errorP);
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
  var input4=document.createElement("input");
  input4.type = "text";
  input4.id="AdmAddPrereqs";
  input4.placeholder='Enter prerequisites (Eg. [["MATH 132","PHYSICS 151"],["CS 187"]]';
  var button1=document.createElement("button");
  button1.type="button";
  button1.id="AdmModeAdd";
  button1.innerText="Submit";
  var result=document.createElement("p");
  result.id="AddResult"
  var button2=document.createElement("button");
  button2.type="button";
  button2.id="AdmModeLogout";
  button2.innerText="Log out";
  const MainArea = document.getElementById("MainArea");
  MainArea.appendChild(input3);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(input4);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(button1);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(result);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(button2);
  const AdmModeSubmit=document.getElementById("AdmModeAdd");
  AdmModeSubmit.addEventListener("click",AdmAddAccept)
  const AdmModeLogout=document.getElementById("AdmModeLogout");
  AdmModeLogout.addEventListener("click",AdmLogout)
}

async function AdmAddAccept(){
  const course= document.getElementById("AdmAddCourse").value.trim();
  const prereqraw= document.getElementById("AdmAddPrereqs").value.trim();
  const result= document.getElementById("AddResult")
  if (!course) {
    result.textContent = "❌ Course name cannot be empty"
    return
  }
  let prerequisites
  try {
    prerequisites = JSON.parse(prereqraw)
  }
  catch {
    result.textContent = "Invalid JSON format for prerequisites"
    return
  }
  const {error} = await supabase
    .from("prereqlookup")
    .insert({ COURSE: course, PREREQS: {prerequisites}})

  if (error){
    result.textContent = "Error adding course"
    return
      }
  result.textContent = "Course Added!"
    
}
async function AdmLogout(){
  await supabase.auth.signOut();
  let MainArea = document.getElementById("MainArea");
  MainArea.innerHTML = "<p>Logged out.</p>";
  let ButtonArea=document.getElementById("ButtonArea");
  ButtonArea.innerHTML=ButtonHTML;
  document.getElementById("VerifMode").addEventListener("click", VerMode)
  document.getElementById("ReccomMode").addEventListener("click", RecMode)
  document.getElementById("AdminMode").addEventListener("click", AdmMode)
  
}
