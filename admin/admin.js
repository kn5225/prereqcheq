import { SUPABASE_URL, SUPABASE_KEY, COURSES_TABLE, SUBMISSIONS_TABLE } from "../config.js"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ButtonHTML = document.getElementById("ButtonArea").innerHTML;
function getMainArea() { return document.getElementById("MainArea") }

function makeElement(tag, props = {}) {
  const el = document.createElement(tag)
  Object.assign(el, props)
  return el
}

function appendBr(parent) {
  parent.appendChild(document.createElement("br"))
}

function parsePrereqString(input) {
  return input.trim()
    .split(/\s+AND\s+/)
    .map(group => group.replace(/[()]/g, "").trim().split(/\s+OR\s+/).map(c => c.trim()))
}

function formatCourse(input) {
  return input.trim().toUpperCase().replace(/^([A-Z]+)\s*(\d+[A-Z]?)$/, "$1 $2")
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

function sanitize(input) { return input.trim().toUpperCase() }

function isValidPrereqs(input) {
  if (input.length > 500) return false
  const parsed = parsePrereqString(input)
  return parsed.length <= 10 && parsed.every(group => group.length <= 5)
}

const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  showLogin()
} else {
  showAdminPanel()
}


function showLogin() {
  document.getElementById("ButtonArea").innerHTML = ""
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const input1 = makeElement("input", { type: "email", id: "AdmInputEmail", placeholder: "Enter email..." })
  const input2 = makeElement("input", { type: "password", id: "AdmInputPassword", placeholder: "Enter password..." })
  const button = makeElement("button", { type: "button", innerText: "Login" })
  const errP = makeElement("p", { id: "loginErr" })
  const returnBtn = makeElement("button", { type: "button", innerText: "Return to main site" })

  MainArea.appendChild(input1); appendBr(MainArea)
  MainArea.appendChild(input2); appendBr(MainArea)
  MainArea.appendChild(button)
  MainArea.appendChild(errP)
  MainArea.appendChild(returnBtn)

  returnBtn.addEventListener("click", () => {
    window.location.href = "../"
  })
  button.addEventListener("click", async () => {
    const email = document.getElementById("AdmInputEmail").value
    const password = document.getElementById("AdmInputPassword").value
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      document.getElementById("loginErr").textContent = "❌ Invalid credentials"
      return
    }
    showAdminPanel()
  })
}

function showAdminPanel() {
  let MainArea = getMainArea()
  MainArea.innerHTML = ""
  let ButtonArea = document.getElementById("ButtonArea")
  ButtonArea.innerHTML = ButtonHTML
  const existing = document.getElementById("AdmLogoutBtn")
  if (existing) {existing.remove()}
  const logoutBtn = makeElement("button", { type: "button", id: "AdmLogoutBtn", innerText: "Log out" })
  ButtonArea.appendChild(logoutBtn)
  document.getElementById("AdmAdd").addEventListener("click", AdmModeAdd)
  document.getElementById("AdmUpdate").addEventListener("click", AdmModeUpdate)
  document.getElementById("AdmReview").addEventListener("click", AdmReview)
  document.getElementById("AdmLogoutBtn").addEventListener("click", AdmLogout)
}

function AdmModeAdd() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const input3 = makeElement("input", { type: "text", id: "AdmAddCourse", placeholder: "Enter course (Eg. ECE 213)" })
  const courseHint = makeElement("p", { id: "AdminAddCourseHint" })
  const input4 = makeElement("input", { type: "text", id: "AdmAddPrereqs", placeholder: 'Enter prerequisites (Eg. (MATH 132 OR PHYSICS 151) AND (CS 187)) or "NONE"' })
  const prereqHint = makeElement("p", { id: "AdmAddPrereqHint" })
  const preview = makeElement("p", { id: "prereqPreview" })
  const button1 = makeElement("button", { type: "button", innerText: "Submit" })
  const result = makeElement("p", { id: "AddResult" })
  input3.addEventListener("input", (e) => {
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

  input4.addEventListener("input", (e) => {
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

  MainArea.appendChild(input3); appendBr(MainArea)
  MainArea.appendChild(courseHint)
  MainArea.appendChild(input4)
  MainArea.appendChild(prereqHint)
  MainArea.appendChild(preview); appendBr(MainArea)
  MainArea.appendChild(button1); appendBr(MainArea)
  MainArea.appendChild(result)

  button1.addEventListener("click", AdmAddAccept)
}

async function AdmAddAccept() {
  const course = formatCourse(document.getElementById("AdmAddCourse").value)
  const prereqraw = sanitize(document.getElementById("AdmAddPrereqs").value)
  const result = document.getElementById("AddResult")

  if (!course) { result.textContent = "❌ Course name cannot be empty"; return }
  if (!isValidPrereqs(prereqraw)) { result.textContent = "❌ Prerequisites too complex or too long"; return }

  let prerequisites = []
  if (prereqraw && prereqraw !== "NONE") {
    try { prerequisites = formatPrereqString(prereqraw) }
    catch { result.textContent = "❌ Invalid format for prerequisites"; return }
  }

  const { error } = await supabase
    .from(COURSES_TABLE)
    .insert({ COURSE: course, PREREQS: prerequisites })

  result.textContent = error ? "❌ Error adding course" : "✅ Course added!"
}

function AdmModeUpdate() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const input1 = makeElement("input", { type: "text", id: "UpdateCourse", placeholder: "Enter course to update (Eg. ECE 213)" })
  const searchBtn = makeElement("button", { type: "button", id: "UpdateSearch", innerText: "Search" })
  const result = makeElement("p", { id: "UpdateResult" })

  MainArea.appendChild(input1); appendBr(MainArea)
  MainArea.appendChild(searchBtn); appendBr(MainArea)
  MainArea.appendChild(result)

  searchBtn.addEventListener("click", AdmUpdateSearch)
}

async function AdmUpdateSearch() {
  const course = sanitize(document.getElementById("UpdateCourse").value)
  const result = document.getElementById("UpdateResult")

  if (!course) { result.textContent = "❌ Course name cannot be empty"; return }

  const { data, error } = await supabase
    .from(COURSES_TABLE)
    .select("*")
    .eq("COURSE", course)

  if (error) { result.textContent = "❌ Error searching"; return }
  if (!data || data.length === 0) { result.textContent = "❌ Course not found"; return }

  result.textContent = ""

  const current = data[0]
  const currentPrereqs = makeElement("p", { textContent: `Current prerequisites: ${JSON.stringify(current.PREREQS)}` })
  const input2 = makeElement("input", { type: "text", id: "UpdatePrereqs", placeholder: 'Enter new prerequisites or "NONE"' })
  const preview = makeElement("p", { id: "UpdatePreview" })
  const prereqHint = makeElement("p", { id: "AdmAddPrereqHint" })
  const updateBtn = makeElement("button", { type: "button", id: "UpdateSubmit", innerText: "Update" })
  const updateResult = makeElement("p", { id: "UpdateConfirm" })

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

  const MainArea = getMainArea()
  MainArea.appendChild(currentPrereqs)
  MainArea.appendChild(input2)
  MainArea.appendChild(preview); appendBr(MainArea)
  MainArea.appendChild(updateBtn); appendBr(MainArea)
  MainArea.appendChild(updateResult)

  updateBtn.addEventListener("click", () => AdmUpdateAccept(course))
}

async function AdmUpdateAccept(course) {
  const prereqraw = sanitize(document.getElementById("UpdatePrereqs").value)
  const updateResult = document.getElementById("UpdateConfirm")

  if (!isValidPrereqs(prereqraw) && prereqraw !== "NONE") { updateResult.textContent = "❌ Prerequisites too complex or too long"; return }

  let prerequisites = []
  if (prereqraw && prereqraw !== "NONE") {
    try { prerequisites = formatPrereqString(prereqraw) }
    catch { updateResult.textContent = "❌ Invalid format for prerequisites"; return }
  }

  const { error } = await supabase
    .from(COURSES_TABLE)
    .update({ PREREQS: prerequisites })
    .eq("COURSE", course)

  updateResult.textContent = error ? "❌ Error updating course" : "✅ Course updated!"
}

async function AdmReview() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select("*")
    .eq("verified", false)

  if (error) { console.error(error); return }

  if (!data || data.length === 0) {
    MainArea.appendChild(makeElement("p", { textContent: "No pending submissions." }))
    return
  }

  data.forEach(submission => {
    const div = document.createElement("div")
    div.style.cssText = "border-left:3px solid #881c3c; padding-left:10px; margin-bottom:16px"

    const course = makeElement("p", { 
    textContent: `${submission.is_correction ? "🔄 Correction" : "➕ New"} — ${submission.COURSE}` })
    const prereqs = makeElement("p", { textContent: `Prerequisites: ${JSON.stringify(submission.PREREQS)}` })
    const approveBtn = makeElement("button", { innerText: "✅ Approve" })
    const rejectBtn = makeElement("button", { innerText: "❌ Reject" })

    approveBtn.addEventListener("click", async () => {
      if (submission.is_correction) {
  const { error: updateError } = await supabase
    .from(COURSES_TABLE)
    .update({ PREREQS: submission.PREREQS })
    .eq("COURSE", submission.COURSE)
  if (updateError) { div.appendChild(makeElement("p", { textContent: "❌ Error applying correction" })); return }
}
    else {
    const { data: existing } = await supabase
      .from(COURSES_TABLE)
      .select("COURSE")
      .eq("COURSE", submission.COURSE)
    if (existing && existing.length > 0) {
      await supabase.from(SUBMISSIONS_TABLE).delete().eq("id", submission.id)
      div.remove()
      return
    }
    const { error } = await supabase
      .from(COURSES_TABLE)
      .insert({ COURSE: submission.COURSE, PREREQS: submission.PREREQS })
    if (error) { div.appendChild(makeElement("p", { textContent: "❌ Error approving" })); return }}
    await supabase.from(SUBMISSIONS_TABLE).delete().eq("id", submission.id)
    div.remove()
})

    rejectBtn.addEventListener("click", async () => {
      const { error } = await supabase
        .from(SUBMISSIONS_TABLE)
        .delete()
        .eq("id", submission.id)
      if (error) { div.appendChild(makeElement("p", { textContent: "❌ Error rejecting" })); return }
      div.remove()
    })

    div.appendChild(course)
    div.appendChild(prereqs)
    div.appendChild(approveBtn)
    div.appendChild(rejectBtn)
    MainArea.appendChild(div)
  })
}

async function AdmLogout() {
  await supabase.auth.signOut()
  showLogin()
}
