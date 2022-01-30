let myleads = []

const inputBtn = document.getElementById("input-btn")
const inputEl = document.getElementById("input-el")
const ulEl = document.getElementById("ul-el")
const deleteBtn = document.getElementById("delete-btn")
const tabBtn = document.getElementById("tab-btn")

const leadsFromLocalStorage = JSON.parse(localStorage.getItem("myleads"))
if (leadsFromLocalStorage) {
    myleads = leadsFromLocalStorage
    render(myleads)
}
tabBtn.addEventListener("click", function() {
    //chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {});
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        myleads.push(tabs[0].url)
        localStorage.setItem("myleads", JSON.stringify(myleads))
        render(myleads)
    })
})

function deleteLink(index,leads){
        const updatedLead = leads.splice(index,1)
        localStorage.removeItem("myleads")
        localStorage.setItem("myleads", JSON.stringify(updatedLead))
        render(leads)
    }

function render(leads) {
    while (ulEl.firstChild) {
        ulEl.removeChild(ulEl.lastChild);
      }
    leads.forEach((lead,index)=>{
        const li = document.createElement('li')
        const b = document.createElement('b')
        const a = document.createElement('a')
        const i = document.createElement('i')
        const hr = document.createElement('hr')
        a.textContent=lead
        i.addEventListener('click',()=>deleteLink(index,leads))
        i.className = "fa fa-trash"
        a.target= "_blank"
        a.href= lead
        b.textContent = `${index + 1}- `
        li.appendChild(b)
        li.appendChild(a)
        li.appendChild(i)
        li.appendChild(hr)
        ulEl.appendChild(li)
        
    })
}

deleteBtn.addEventListener("dblclick", function() {
    localStorage.clear()
    myleads = []
    render(myleads)
})

inputBtn.addEventListener("click", function() {
    if(!inputEl.value){
        return
    }
    myleads.push(inputEl.value)
    inputEl.value = ""
    localStorage.setItem("myleads", JSON.stringify(myleads))
    render(myleads)
})