const closeWindow = document.getElementById('closeWindow'),
    minimizeWindow = document.getElementById('minimizeWindow'),
    settingsWindowButton = document.getElementById('settings-button'),
    settingsWindow = document.getElementById('settings'),
    closeSettingsWindow = document.getElementById('closeSettingsWindow')

closeWindow.addEventListener('click', () => {
    window.require('electron').ipcRenderer.send('closeWindow', true)
})

minimizeWindow.addEventListener('click', () => {
    window.require('electron').ipcRenderer.send('minimizeWindow', true)
})

settingsWindowButton.addEventListener('click', () => {
    settingsWindow.style.display = 'block'
})

closeSettingsWindow.addEventListener('click', () => {
    settingsWindow.style.display = 'none'
})

let wX = 0,
    wY = 0,
    dragging = false

const nav = document.getElementsByTagName('nav')[0]

nav.onmousedown = (e) => {
    if (e.target !== nav) return
    dragging = true;
    wX = e.pageX;
    wY = e.pageY;
}

window.onmousemove = (e) => {
    if(dragging){
        window.moveTo(e.screenX-wX, e.screenY-wY);
    }
}

window.onmouseup = (e) => {
    dragging = false
}