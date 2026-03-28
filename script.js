import { SUPABASE_URL, SUPABASE_KEY } from "./config.js"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

let courseHistory = []
let substitutions = {}

function parsePrereqString(input) {
  input = input.trim()
  const andGroups = input.split(/\s+AND\s+/)
  const result = andGroups.map(group => {
    group = group.replace(/[()]/g, "").trim()
    return group.split(/\s+OR\s+/).map(course => course.trim())
  })
  return result
}
function sanitize(input) {
  return input.trim().toUpperCase()
}

function isValidPrereqs(input) {
  if (input.length > 500) return false
  const parsed = parsePrereqString(input)
  if (parsed.length > 10 || parsed.some(group => group.length > 5)) return false
  return true
}
async function loadSubstitutions() {
  const { data } = await supabase.from("substitutions").select("*")
  data.forEach(s => substitutions[s.original] = s.replacements)
}

function meetsCourse(course, completed) {
  if (completed.includes(course)) return true
  if (substitutions[course]) {
    return substitutions[course].every(sub => completed.includes(sub))
  }
  return false
}

function meetsPrereqs(prerequisites, completed) {
  return prerequisites.every(group =>
    group.some(course => meetsCourse(course, completed))
  )
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
await loadSubstitutions()
const VerifMode = document.getElementById("VerifMode");
VerifMode.addEventListener("click",VerMode);
const ReccomMode = document.getElementById("ReccomMode");
ReccomMode.addEventListener("click",RecMode);
const AdminMode = document.getElementById("AdminMode");
AdminMode.addEventListener("click",AdmMode);
const ButtonArea=document.getElementById("ButtonArea");
const ButtonHTML = ButtonArea.innerHTML;



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
  VerSubmit.addEventListener("click", () => VerModeAccept());
}

async function VerModeAccept(courseOverride = null, isBack = false) {
  const VerClass = courseOverride || sanitize(document.getElementById("VerInput").value);
  if (courseOverride && !isBack) {
    const previous = document.getElementById("VerInput").value;
    courseHistory.push(previous);
    document.getElementById("VerInput").value = courseOverride;
  } 
  else if (courseOverride && isBack) {
    document.getElementById("VerInput").value = courseOverride;
  }
  else {
    courseHistory = []
  }
  
  const oldDiv = document.getElementById("checkBoxDiv")
  const CheckBoxDiv = document.createElement("div")
  CheckBoxDiv.id = "checkBoxDiv"
  oldDiv.replaceWith(CheckBoxDiv)

  if (courseHistory.length > 0) {
    const backBtn = document.createElement("button")
    backBtn.textContent = "← Back"
    backBtn.addEventListener("click", () => {
      const prev = courseHistory.pop()
      VerModeAccept(prev, true)
    })
    CheckBoxDiv.appendChild(backBtn)
    CheckBoxDiv.appendChild(document.createElement("br"))
  }
  
  const { data, error } = await supabase
    .from("prereqlookup")
    .select("*")
    .eq("COURSE", VerClass)
  if (error) { console.error(error); return }
  if (!data || data.length === 0) {
    const p = document.createElement("p")
    p.textContent = "Course not found."
    CheckBoxDiv.appendChild(p)
    return
  }
  const course = data[0];
  if (course.PREREQS.length === 0) {
    const p = document.createElement("p")
    p.textContent = "No prerequisites for this course."
    CheckBoxDiv.appendChild(p)
    return
  }
  const prerequisites = course.PREREQS;
  prerequisites.forEach((group, index) => {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `group-${index}`;
  const label = document.createElement("label");
  label.htmlFor = `group-${index}`;
  group.forEach((c, i) => {
      const span = document.createElement("span")
      span.textContent = c
      span.style.cursor = "pointer"
      span.style.color = "#881c3c"
      span.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        VerModeAccept(c)
      })
      label.appendChild(span)

      if (substitutions[c]) {
        label.appendChild(document.createTextNode(" (or all of: "))
  
        substitutions[c].forEach((sub, si) => {
          const subSpan = document.createElement("span")
          subSpan.textContent = sub
          subSpan.style.cursor = "pointer"
          subSpan.style.color = "#881c3c"
          subSpan.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (courseHistory.includes(sub)) return
          VerModeAccept(sub)
          })
          
          label.appendChild(subSpan)
          if (si < substitutions[c].length - 1) {
            label.appendChild(document.createTextNode(", "))
            }
          })

  label.appendChild(document.createTextNode(")"))
        }
      
      if (i < group.length - 1) {
        label.appendChild(document.createTextNode(" OR "))
      }
    })
  const row = document.createElement("div")
  row.appendChild(checkbox)
  row.appendChild(label)
  CheckBoxDiv.appendChild(row) 
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
  const errP = document.createElement("p");
  errP.id="loginErr"
  const MainArea = document.getElementById("MainArea");
  MainArea.appendChild(input1);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(input2);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(button);
  MainArea.appendChild(errP);
  const AdmSubmit=document.getElementById("AdmModeSubmit");
  AdmSubmit.addEventListener("click",AdmModeAccept)
}

async function AdmModeAccept() {
  const email = document.getElementById("AdmInputEmail").value
  const password = document.getElementById("AdmInputPassword").value

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    document.getElementById("loginErr").textContent = "Invalid credentials!";
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
  var input4=document.createElement("input");
  input4.type = "text";
  input4.id="AdmAddPrereqs";
  input4.placeholder='Enter prerequisites (Eg. (MATH 132  PHYSICS 151) AND (CS 187) or "None" if none exist';
  const preview = document.createElement("p")
  preview.id = "prereqPreview"
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
  MainArea.appendChild(preview)
  document.getElementById("AdmAddPrereqs").addEventListener("input", (e) => {
  try {
    const parsed = parsePrereqString(e.target.value)
    document.getElementById("prereqPreview").textContent = JSON.stringify(parsed)
  } 
  catch {
    document.getElementById("prereqPreview").textContent = "Invalid format"
  }
  })
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
  const course= sanitize(document.getElementById("AdmAddCourse").value);
  const prereqraw= sanitize(document.getElementById("AdmAddPrereqs").value.trim());
  const result= document.getElementById("AddResult")
  if (!course) {
    result.textContent = "❌ Course name cannot be empty"
    return
  }
  if (!isValidPrereqs(prereqraw)) {
  result.textContent = "❌ Prerequisites too complex or too long"
  return
  }
  
  let prerequisites
  if (!prereqraw || prereqraw === 'None') {
  prerequisites = []
  } 
  try {
    prerequisites = parsePrereqString(prereqraw)
  }
  catch {
    result.textContent = "Invalid format for prerequisites"
    return
  }
  const {error} = await supabase
    .from("prereqlookup")
    .insert({ COURSE: course, PREREQS: prerequisites})

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
