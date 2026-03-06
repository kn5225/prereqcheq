import { createClient } from "https://esm.sh/@supabase/supabase-js"

const supabase = createClient("https://dfzsfjcmtxvgotzpdagy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenNmamNtdHh2Z290enBkYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTA4NDUsImV4cCI6MjA4ODA2Njg0NX0.sZgZzPYVa1iwV1wGH3eS0u9hssoTzZrZPXk7_w11Yc0")


const VerifMode = document.getElementById("VerifMode");
VerifMode.addEventListener("click",VerMode);
const ReccomMode = document.getElementById("ReccomMode");
ReccomMode.addEventListener("click",RecMode);

function VerMode() {
  let OldContent = document.getElementById("MainArea");
  OldContent.innerHTML = "";
  var input=document.createElement("input");
  input.type = "text";
  input.id="VerInput";
  var button=document.createElement("button");
  button.type="button";
  button.id="VerModeSubmit";
  button.innerText="Submit";
  const element2 = document.getElementById("MainArea");
  const checkBoxDiv = document.createElement("div")
  checkBoxDiv.id="checkBoxDiv"
  element2.appendChild(input);
  element2.appendChild(button);
  element2.appendChild(checkBox);
  const element3=document.getElementById("VerModeSubmit");
  element3.addEventListener("click", VerModeAccept);
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

  CheckBoxDiv.appendChild(checkbox);
  CheckBoxDiv.appendChild(label);
  })
}
