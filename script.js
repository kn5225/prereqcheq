import { SUPABASE_URL, SUPABASE_KEY } from "./config.js"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
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

function getMainArea() { return document.getElementById("MainArea") }

function makeElement(tag, props = {}) {
  const el = document.createElement(tag)
  Object.assign(el, props)
  return el
}

function appendBr(parent) {
  parent.appendChild(document.createElement("br"))
}

function reattachListeners() {
  document.getElementById("VerifMode").addEventListener("click", VerMode)
  document.getElementById("ReccomMode").addEventListener("click", RecMode)
  document.getElementById("AdminMode").addEventListener("click", AdmMode)
}
await loadSubstitutions()
reattachListeners()
const ButtonArea=document.getElementById("ButtonArea");
const ButtonHTML = ButtonArea.innerHTML;



function VerMode() {
  let MainArea = getMainArea();
  MainArea.innerHTML = "";
  const input = makeElement("input", { type: "text", id: "VerInput", placeholder: "Enter course..." });
  const button = makeElement("button", { type: "button", id: "VerModeSubmit", innerText: "Submit" });
  const checkBoxDiv = makeElement("div", { id: "checkBoxDiv" });
  MainArea.appendChild(input);
  MainArea.appendChild(button);
  MainArea.appendChild(checkBoxDiv);
  button.addEventListener("click", () => VerModeAccept())
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
  if (!course.PREREQS || !Array.isArray(course.PREREQS) || course.PREREQS.length === 0) {
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
        if (courseHistory.includes(c)) return  // add this
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
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const input = makeElement("input", { 
    type: "text", 
    id: "RecInput", 
    placeholder: "Enter completed courses separated by commas (Eg. ECE 201, MATH 132)" 
  })
  const button = makeElement("button", { 
    type: "button", 
    id: "RecSubmit", 
    innerText: "Get Recommendations" 
  })
  const resultDiv = makeElement("div", { id: "RecResults" })

  MainArea.appendChild(input)
  appendBr(MainArea)
  MainArea.appendChild(button)
  appendBr(MainArea)
  MainArea.appendChild(resultDiv)

  button.addEventListener("click", RecModeAccept)
}

async function RecModeAccept() {
  const completed = document.getElementById("RecInput").value
    .split(",")
    .map(c => sanitize(c))
    .filter(c => c.length > 0)

  const resultDiv = document.getElementById("RecResults")
  resultDiv.innerHTML = ""

  const { data, error } = await supabase.from("prereqlookup").select("*")

  if (error) { console.error(error); return }

  const eligible = data.filter(course => {
    if (!course.PREREQS || !Array.isArray(course.PREREQS) || course.PREREQS.length === 0) return false
    return meetsPrereqs(course.PREREQS, completed)
  })

  if (eligible.length === 0) {
    const p = document.createElement("p")
    p.textContent = "No courses available with your completed courses."
    resultDiv.appendChild(p)
    return
  }

  eligible.forEach(course => {
    const p = document.createElement("p")
    p.textContent = course.COURSE
    resultDiv.appendChild(p)
  })
}
function AdmMode() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""
  const input1 = makeElement("input", { type: "email", id: "AdmInputEmail", placeholder: "Enter email..." });
  const input2 = makeElement("input", { type: "password", id: "AdmInputPassword", placeholder: "Enter password..." });
  const button = makeElement("button", { type: "button", id: "AdmModeSubmit", innerText: "Submit" });
  const errP = makeElement("p", { id: "loginErr" });
  MainArea.appendChild(input1);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(input2);
  MainArea.appendChild(document.createElement("br"));
  MainArea.appendChild(button);
  MainArea.appendChild(errP);
  button.addEventListener("click", AdmModeAccept)
}

async function AdmModeAccept() {
  const email = document.getElementById("AdmInputEmail").value
  const password = document.getElementById("AdmInputPassword").value

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    document.getElementById("loginErr").textContent = "Invalid credentials!";
    return
  }
  AdmModeAdd()
}

function AdmModeAdd(){
   document.getElementById("ButtonArea").innerHTML = ""
  const MainArea = getMainArea()
  MainArea.innerHTML = ""
  const input3 = makeElement("input", { type: "text", id: "AdmAddCourse", placeholder: "Enter course (Eg. ECE 213)" });
  const input4 = makeElement("input", { type: "text", id: "AdmAddPrereqs", placeholder: 'Enter prerequisites (Eg. (MATH 132 OR PHYSICS 151) AND (CS 187)) or "None" if none exist' });
  const preview = makeElement("p", { id: "prereqPreview" });
  const button1 = makeElement("button", { type: "button", id: "AdmModeAdd", innerText: "Submit" });
  const result = makeElement("p", { id: "AddResult" });
  const button2 = makeElement("button", { type: "button", id: "AdmModeLogout", innerText: "Log out" });
  input4.addEventListener("input", (e) => {
    try {
      preview.textContent = "Preview: " + JSON.stringify(parsePrereqString(e.target.value))
    } catch {
      preview.textContent = "Invalid format"
    }
  })
  MainArea.appendChild(input3); appendBr(MainArea)
  MainArea.appendChild(input4)
  MainArea.appendChild(preview); appendBr(MainArea)
  MainArea.appendChild(button1); appendBr(MainArea)
  MainArea.appendChild(result); appendBr(MainArea)
  MainArea.appendChild(button2)
  button1.addEventListener("click", AdmAddAccept)
  button2.addEventListener("click", AdmLogout)
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
  
  let prerequisites = []
  if (prereqraw && prereqraw !== 'NONE') {
  try {
    prerequisites = parsePrereqString(prereqraw)
  } catch {
    result.textContent = "Invalid format for prerequisites"
    return
  }
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
  let MainArea = getMainArea();
  MainArea.innerHTML = "<p>Logged out.</p>";
  let ButtonArea=document.getElementById("ButtonArea");
  ButtonArea.innerHTML=ButtonHTML;
  reattachListeners()
  
}
