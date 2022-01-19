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
        console.log(tabs)
        myleads.push(tabs[0].url)
        localStorage.setItem("myleads", JSON.stringify(myleads))
        render(myleads)
    })

})

function render(leads) {
    let listItems = ulEl.innerHTML
    listItems = ""
    for (let i = 0; i < leads.length; i++) {
        listItems += `
        <li>
            <a target= '_blank' href= '${leads[i]}' >
            ${leads[i]}
            </a>
        </li>
        `
    }
    ulEl.innerHTML = listItems
}

deleteBtn.addEventListener("dblclick", function() {
    localStorage.clear()
    myleads = []
    render(myleads)
})

inputBtn.addEventListener("click", function() {
    myleads.push(inputEl.value)
    inputEl.value = ""
    localStorage.setItem("myleads", JSON.stringify(myleads))
    render(myleads)
})