import { createClient } from "https://esm.sh/@supabase/supabase-js"

const supabase = createClient("https://dfzsfjcmtxvgotzpdagy.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenNmamNtdHh2Z290enBkYWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTA4NDUsImV4cCI6MjA4ODA2Njg0NX0.sZgZzPYVa1iwV1wGH3eS0u9hssoTzZrZPXk7_w11Yc0")


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
  const { data, error } = await supabase
    .from("prereqlookup")
    .select("*")
    .eq("COURSE", VerClass)
  var dat=document.createElement("p");
  dat.textContent=data;
  dat.id="Data";
  const element2 = document.getElementById("MainArea");
  element2.appendChild(dat);
  
  
}
