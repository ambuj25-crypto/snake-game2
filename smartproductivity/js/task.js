let taskinput=document.getElementById('taskinput');
let addtaskbtn=document.getElementById('addTaskbtn');
let tasklist=document.getElementById('tasklist');

let tasks=[];

class Task{
    constructor(id,title,completed=false){
        this.id=id;
        this.title=title;
        this.completed=completed;
    }
}

function addtask(){
    const tasktext=taskinput.value.trim();

    if(tasktext===""){
        showtoast("Please enter a task","error");
        return;
    }
    const newtask=new Task(Date.now(),tasktext);
    tasks.push(newtask);

    savetask();
    rendertask();

    taskinput.value="";
    showtoast("Task added successfully","success");

}

addtaskbtn.addEventListener("click",addtask);

function rendertask(){
    tasklist.innerHTML="";

    tasks.forEach(val => {
        
          const li=document.createElement("li");
           li.textContent=val.title;

         const span=document.createElement("span");
          span.textContent=val.title;

         
       
        //  if(val.title=== tasks.find(val=>val.id===val.id)?.title){
        //     li.style.fontWeight="bold";
        //  }
        //  else{            
        //     li.style.fontWeight="normal";
        //  }
          if (val.completed) {
            span.style.textDecoration = "line-through";
         }
        li.addEventListener("click",()=> toggletask(val.id));
         li.addEventListener("dblclick", () => {
             enableEditMode(val.id, span);
             });
        const deletebtn=document.createElement("button");
        deletebtn.textContent="Delete";
        deletebtn.addEventListener("click",(e)=>{
             e.stopPropagation();
            deletetask(val.id);
        });
        li.style.marginLeft="10px";
        li.appendChild(deletebtn);
        tasklist.appendChild(li);
    });

}

function toggletask(id){
     tasks=tasks.map(t=>
        t.id===id?new Task(t.id,t.title,!t.completed):t
    );
    savetask();
    rendertask();
}

function deletetask(id){
    tasks=tasks.filter(task=>task.id!==id);
    savetask();
    rendertask();
    showtoast("Task deleted successfully","success");
}

function savetask(){
    localStorage.setItem("tasks",JSON.stringify(tasks));
}

function loadtask(){
    const data=localStorage.getItem("tasks");
    if(data){
        tasks=JSON.parse(data);
        rendertask();
    }
}
loadtask();

function showtoast(message,type ="success"){
    const container=document.getElementById("toast-container");

    const toast=document.createElement("div");
    toast.className=`toast ${type}`;
    toast.innerText=message;

    container.appendChild(toast);

    setTimeout(()=>{
        toast.remove();
    },3000);
}
    
 function enableEditMode(id, span) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = span.textContent;

  span.replaceWith(input);
  input.focus();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const newtitle = input.value.trim();

      if (newtitle === "") {
        showtoast("Task cannot be empty", "error");
        rendertask();
        return;
      }

      updateTask(id, newtitle);
    }
  });
}


function updateTask(id, newtitle) {
  tasks = tasks.map(t =>
    t.id === id ? new Task(t.id, newtitle, t.completed) : t
  );

  savetask();
  rendertask();
  showtoast("Task updated successfully", "success");
}


