import { SUPABASE_URL, SUPABASE_KEY, COURSES_TABLE, SUBMISSIONS_TABLE } from "../config.js"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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

  MainArea.appendChild(input1); appendBr(MainArea)
  MainArea.appendChild(input2); appendBr(MainArea)
  MainArea.appendChild(button)
  MainArea.appendChild(errP)

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
  document.getElementById("AdmAdd").addEventListener("click", AdmModeAdd)
  document.getElementById("AdmReview").addEventListener("click", AdmReview)
  document.getElementById("AdmLogoutBtn").addEventListener("click", AdmLogout)
}

function AdmModeAdd() {
  const MainArea = getMainArea()
  MainArea.innerHTML = ""

  const input3 = makeElement("input", { type: "text", id: "AdmAddCourse", placeholder: "Enter course (Eg. ECE 213)" })
  const input4 = makeElement("input", { type: "text", id: "AdmAddPrereqs", placeholder: 'Enter prerequisites (Eg. (MATH 132 OR PHYSICS 151) AND (CS 187)) or "None"' })
  const preview = makeElement("p", { id: "prereqPreview" })
  const button1 = makeElement("button", { type: "button", innerText: "Submit" })
  const result = makeElement("p", { id: "AddResult" })

  input4.addEventListener("input", (e) => {
    try {
      preview.textContent = "Preview: " + JSON.stringify(formatPrereqString(e.target.value))
    } catch {
      preview.textContent = "Invalid format"
    }
  })

  MainArea.appendChild(input3); appendBr(MainArea)
  MainArea.appendChild(input4)
  MainArea.appendChild(preview); appendBr(MainArea)
  MainArea.appendChild(button1); appendBr(MainArea)
  MainArea.appendChild(result)

  button1.addEventListener("click", async () => {
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
  })
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

    const course = makeElement("p", { textContent: `Course: ${submission.COURSE}` })
    const prereqs = makeElement("p", { textContent: `Prerequisites: ${JSON.stringify(submission.PREREQS)}` })
    const approveBtn = makeElement("button", { innerText: "✅ Approve" })
    const rejectBtn = makeElement("button", { innerText: "❌ Reject" })

    approveBtn.addEventListener("click", async () => {
      const { error: insertError } = await supabase
        .from(COURSES_TABLE)
        .insert({ COURSE: submission.COURSE, PREREQS: submission.PREREQS })
      if (insertError) { div.appendChild(makeElement("p", { textContent: "❌ Error approving" })); return }
      const { error: deleteError } = await supabase
        .from(SUBMISSIONS_TABLE)
        .delete()
        .eq("id", submission.id)
      if (deleteError) { div.appendChild(makeElement("p", { textContent: "❌ Error removing submission" })); return }
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
