const modpack_location = document.getElementById('modpack-location')

async function main() {
    (<HTMLInputElement>modpack_location).value = await window.require('electron').ipcRenderer.invoke('getStoreValue', 'folder_location')
}

main()

modpack_location.addEventListener('click', async () => {
    await window.require('electron').ipcRenderer.invoke('folder', await window.require('electron').ipcRenderer.invoke('getStoreValue', 'folder_location'))
    main()
})