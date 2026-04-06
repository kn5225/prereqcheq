import { SUPABASE_URL, SUPABASE_KEY, COURSES_TABLE, SUBMISSIONS_TABLE } from "./config.js"
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
  const { data, error } = await supabase.from("substitutions").select("*")
  if (error || !data) { console.error("Failed to load substitutions", error); return }
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

function attachListeners() {
  document.getElementById("VerifMode").addEventListener("click", VerMode)
  document.getElementById("ReccomMode").addEventListener("click", RecMode)
  document.getElementById("ContribMode").addEventListener("click", ContribMode)
  document.getElementById("AdminMode").addEventListener("click", () => {
  document.getElementById("adminPopup").classList.add("active")})
  document.getElementById("DemoMode").addEventListener("click", () => {
  window.location.href = "./demo/"})
}

function formatCourse(input) {
  return input
    .trim()
    .toUpperCase()
    .replace(/^([A-Z]+)\s*(\d+[A-Z]?)$/, "$1 $2")
}

function formatPrereqString(input) {
  const parsed = parsePrereqString(input)
  const validCourse = /^[A-Z]{2,7}\s\d{3}[A-Z]?$/
  const allValid = parsed.every(group =>
    group.every(course => validCourse.test(formatCourse(course)))
  )
  
  if (!allValid) throw new Error("Invalid course code in prerequisites")
  
  return parsed.map(group => group.map(course => formatCourse(course)))
}

await loadSubstitutions()
attachListeners()

document.getElementById("popupClose").addEventListener("click", () => {
  document.getElementById("adminPopup").classList.remove("active")
  document.getElementById("popupError").textContent = ""
  document.getElementById("popupEmail").value = ""
  document.getElementById("popupPassword").value = ""
})

document.getElementById("popupSubmit").addEventListener("click", async () => {
  const email = document.getElementById("popupEmail").value
  const password = document.getElementById("popupPassword").value
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) { window.location.href = "./admin/"; return }
  document.getElementById("popupError").textContent = "❌ Invalid credentials"
})

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
    .from(COURSES_TABLE)
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
  const result = document.createElement("p")
  result.id = "prereqResult"
  document.getElementById("checkBoxDiv").appendChild(result)

  document.getElementById("checkBoxDiv").addEventListener("change", () => {
    const checkboxes = document.querySelectorAll("#checkBoxDiv input[type='checkbox']")
    const allMet = [...checkboxes].every(cb => cb.checked)
    result.textContent = allMet ? "✅ Prerequisites met" : "❌ Prerequisites not met"
  })
}
function RecMode() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const label = makeElement("p", { textContent: "Enter your completed courses:" })
  label.style.fontWeight = "500"
  label.style.marginBottom = "8px"

  const input = makeElement("input", {
    type: "text",
    id: "RecInput",
    placeholder: "Eg. ECE 201, MATH 132, PHYSICS 151"
  })

  const hint = makeElement("p", { textContent: "Separate courses with commas" })
  hint.style.fontSize = "0.78rem"
  hint.style.color = "gray"

  const button = makeElement("button", {
    type: "button",
    id: "RecSubmit",
    innerText: "Get Recommendations"
  })

  const resultDiv = makeElement("div", { id: "RecResults" })

  MainArea.appendChild(label)
  MainArea.appendChild(input)
  MainArea.appendChild(hint)
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

  if (completed.length === 0) {
    const p = makeElement("p", { textContent: "Please enter at least one completed course." })
    resultDiv.appendChild(p)
    return
  }

  const loading = makeElement("p", { textContent: "Finding eligible courses..." })
  loading.style.color = "gray"
  resultDiv.appendChild(loading)

  const { data, error } = await supabase.from(COURSES_TABLE).select("*")

  if (error) { console.error(error); return }

  const eligible = data.filter(course => {
    if (!course.PREREQS || !Array.isArray(course.PREREQS) || course.PREREQS.length === 0) return false
    if (completed.includes(course.COURSE)) return false
    return meetsPrereqs(course.PREREQS, completed)
  })

  resultDiv.innerHTML = ""

  if (eligible.length === 0) {
    const p = makeElement("p", { textContent: "No courses available with your completed courses." })
    resultDiv.appendChild(p)
    return
  }

  const count = makeElement("p", { textContent: `${eligible.length} course${eligible.length > 1 ? "s" : ""} available:` })
  count.style.fontWeight = "500"
  count.style.marginBottom = "8px"
  resultDiv.appendChild(count)

  const list = document.createElement("div")
  list.style.cssText = "background:white; border:1px solid #d1d5db; border-top:3px solid #881c3c; border-radius:3px; padding:16px;"

  eligible.forEach((course, i) => {
    const row = document.createElement("div")
    row.style.cssText = `padding:6px 0; ${i < eligible.length - 1 ? "border-bottom:1px solid #f0f0f0;" : ""}`
    row.textContent = course.COURSE
    list.appendChild(row)
  })

  resultDiv.appendChild(list)
}

function ContribMode() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const input1 = makeElement("input", { type: "text", id: "ContribCourse", placeholder: "Enter course (Eg. ECE 213)" })
  const courseHint = makeElement("p", { id: "ContribCourseHint" })
  courseHint.style.fontSize = "12px"
  courseHint.style.color = "gray"

  const input2 = makeElement("input", { type: "text", id: "ContribPrereqs", placeholder: 'Enter prerequisites (Eg. (MATH 132 OR PHYSICS 151) AND (CS 187)) or "NONE"' })
  const prereqHint = makeElement("p", { id: "ContribPrereqHint" })
  prereqHint.style.fontSize = "12px"
  prereqHint.style.color = "gray"

  const preview = makeElement("p", { id: "ContribPreview" })
  const button = makeElement("button", { type: "button", id: "ContribSubmit", innerText: "Submit" })
  const result = makeElement("p", { id: "ContribResult" })

  input1.addEventListener("input", (e) => {
    const val = e.target.value.trim().toUpperCase()
    const valid = /^[A-Z]{2,7}\s\d{3}[A-Z]?$/.test(val)
    if (!val) {
      courseHint.textContent = ""
    } else if (valid) {
      courseHint.textContent = "Valid format"
      courseHint.style.color = "green"
    } else {
      courseHint.textContent = "Expected format: DEPT 000 (Eg. ECE 210)"
      courseHint.style.color = "black"
    }
  })

  input2.addEventListener("input", (e) => {
  const val = e.target.value.trim().toUpperCase()
  if (val === "NONE") {
    preview.textContent = "No prerequisites"
    prereqHint.textContent = ""
    return
  }
  try {
    preview.textContent = "Preview: " + JSON.stringify(formatPrereqString(e.target.value))
    prereqHint.textContent = ""
    preview.style.color = "gray"
  } catch {
    preview.textContent = ""
    prereqHint.textContent = "Invalid format"
    prereqHint.style.color = "red"
  }
})

  MainArea.appendChild(input1)
  MainArea.appendChild(courseHint)
  MainArea.appendChild(input2)
  MainArea.appendChild(prereqHint)
  MainArea.appendChild(preview)
  MainArea.appendChild(button); appendBr(MainArea)
  MainArea.appendChild(result)

  button.addEventListener("click", ContribModeAccept)
}

async function ContribModeAccept() {
  const course = formatCourse(document.getElementById("ContribCourse").value)
  const prereqraw = sanitize(document.getElementById("ContribPrereqs").value)
  const result = document.getElementById("ContribResult")

  if (!course) {
    result.textContent = "Course name cannot be empty"
    return
  }

  if (!isValidPrereqs(prereqraw)) {
    result.textContent = "Prerequisites too complex or too long"
    return
  }
  let prerequisites = []
  if (prereqraw && prereqraw !== "NONE") {
    try {
      prerequisites = formatPrereqString(prereqraw)
    } catch {
      result.textContent = "Invalid format for prerequisites"
      return
    }
  }
  const { data: existing } = await supabase
    .from(COURSES_TABLE)
    .select("COURSE")
    .eq("COURSE", course)

  if (existing && existing.length > 0) {
    const { error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .insert({ COURSE: course, PREREQS: prerequisites, is_correction: true })

    if (error) { result.textContent = "❌ Error submitting correction"; return }
    result.textContent = "✅ Correction submitted for review! Thank you."
    return
  }
  const { error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .insert({ COURSE: course, PREREQS: prerequisites })

  if (error) {
    result.textContent = "Error submitting course"
    return
  }
  result.textContent = "Submitted for review! Thank you."
}

