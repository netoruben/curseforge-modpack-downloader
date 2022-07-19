import JSZip from 'jszip'

const modpackZIP = document.getElementById('chooseModpackZIP'),
        modpackModsInstaller = document.getElementById('modpackMods')

let manifest: { name: string; files: [{ downloadUrl: string, fileID: number, projectID: number }], version: string; minecraft: { version: string; modLoaders: { id: string }[] } },
    modpackURL: string

modpackZIP.addEventListener('change', async (event) => {
    const user_folder_location = await window.require('electron').ipcRenderer.invoke('getStoreValue', 'folder_location')

    const modpackZIPFile = (<HTMLInputElement>event.target).files[0],
        openModpackZIPFile = new JSZip()

    let modpackImageURL: string,
        modpackTitle: string,
        modpackOwner: string,
        modpackVersion: string,
        modpackEngine: string,
        modpackMinecraftVersion: string

    //Get Manifest and Unzip to .minecraft
    document.getElementById('findModpack').style.display = 'none'
    document.getElementById('loading').style.display = 'grid'
    manifest = await openModpackZIPFile.loadAsync(modpackZIPFile).then(async (zip) => {
        manifest = await zip.files['manifest.json'].async('string').then((fileData) => {
            return JSON.parse(fileData)
        })
        let folderName = user_folder_location + '\\' + manifest.name + ' ' + manifest.version
        document.getElementById('modpackStatus').innerHTML = 'Creating Folder: <span></span>'
        document.getElementById('modpackStatus').children[0].innerHTML = folderName
        window.require('electron').ipcRenderer.send('createFolders', folderName)
        document.getElementById('modpackStatus').children[0].innerHTML = 'mods'
        window.require('electron').ipcRenderer.send('createFolders', folderName + '\\mods')
        Object.keys(zip.files).forEach((file) => {
            if (file !== 'manifest.json' && file !== 'modlist.html' && file.endsWith('/')) {
                folderName = user_folder_location + '\\' + manifest.name + ' ' + manifest.version + file.replace('overrides/', '\\').replace(/(?:\/)/g, '\\')
                document.getElementById('modpackStatus').innerHTML = 'Creating Folder: <span></span>'
                document.getElementById('modpackStatus').children[0].innerHTML = folderName
                window.require('electron').ipcRenderer.send('createFolders', folderName)
            }
            if (file !== 'manifest.json' && file !== 'modlist.html' && file.includes('.') && !file.includes('/.')) {
                zip.file(file).async('nodebuffer').then((fileData) => {
                    folderName = user_folder_location + '\\' + manifest.name + ' ' + manifest.version + file.replace('overrides/', '\\').replace(/(?:\/)/g, '\\')
                    document.getElementById('modpackStatus').innerHTML = 'Extracting File: <span></span>'
                    document.getElementById('modpackStatus').children[0].innerHTML = folderName
                    window.require('electron').ipcRenderer.send('writeContents', folderName, fileData)
                })
            }
        })
        return manifest
    })
    console.log(manifest)

    const googleResult = await getHTML('https://www.google.com/search?q=' + manifest.name + ' curseforge')
    modpackURL = (<Document>googleResult).querySelectorAll('div[data-header-feature="0"]')[0].children[0].children[0].getAttribute('href').replace(/\/files.*/gm, '')

    const curseforgeResult = await getHTML(modpackURL)
    document.getElementById('modpackStatus').innerHTML = 'Modpack Found'
    modpackImageURL = (<Document>curseforgeResult).getElementsByClassName('project-avatar')[0].children[0].attributes[2].nodeValue
    modpackTitle = (<Document>curseforgeResult).getElementsByTagName('h2')[0].innerText
    modpackOwner = (<Document>curseforgeResult).getElementsByClassName('text-sm flex')[0].children[0].children[0].innerHTML
    modpackVersion = manifest.version
    modpackMinecraftVersion = manifest.minecraft.version
    modpackEngine = manifest.minecraft.modLoaders[0].id
    document.getElementById('modpackImage').setAttribute('src', modpackImageURL)
    document.getElementById('modpackTitle').innerText = modpackTitle
    document.getElementById('modpackOwner').children[0].innerHTML = modpackOwner
    document.getElementById('modpackVersion').children[0].innerHTML = modpackVersion
    document.getElementById('modpackMinecraftVersion').children[0].innerHTML = modpackMinecraftVersion
    document.getElementById('modpackEngineVersion').children[0].innerHTML = modpackEngine
    document.getElementById('loading').style.display = 'none'
    document.getElementById('modpackOverview').style.display = 'flex'
    document.getElementById('downloadButton').style.display = 'block'
})

modpackModsInstaller.addEventListener('click', async () => {
    const user_folder_location = await window.require('electron').ipcRenderer.invoke('getStoreValue', 'folder_location')

    let modsURL: string[] = [],
        modCount: number = 0

    const lastPage = ((manifest.files.length / 20).toString().includes('.') ? parseInt((manifest.files.length / 20).toString().replace(/\..*/gm, '')) + 1 : manifest.files.length / 20)

    document.getElementById('downloadButton').style.display = 'none'
    document.getElementById('loading').style.display = 'grid'
    document.getElementById('modpackStatus').innerHTML = 'Finding all mods'

    for(let i = 1; i <= lastPage; i++) {
        const curseforgeResult = await getHTML(modpackURL + '/relations/dependencies?page=' + i)
        let allProjects = Array.from((<Document>curseforgeResult).getElementsByClassName('project-avatar'))
        allProjects.splice(0,1)
        allProjects.forEach((project) => {
            modsURL.push(project.children[0].getAttribute('href'))
            console.log(modsURL)
        })
    }

    document.getElementById('loading').style.display = 'none'
    document.getElementById('modsOverview').style.display = 'block'
    modsURL.forEach(async (modURL) => {
        const curseforgeResult = await getHTML('https://www.curseforge.com' + modURL),
            modProjectID = (<Document>curseforgeResult).getElementsByClassName('w-full flex justify-between')[0].children[1].innerHTML,
            modImageURL = (<Document>curseforgeResult).getElementsByClassName('project-avatar')[0].children[0].attributes[2].nodeValue,
            modTitle = (<Document>curseforgeResult).getElementsByTagName('h2')[0].innerText,
            modOwner = (<Document>curseforgeResult).getElementsByClassName('text-sm flex')[0].children[0].children[0].innerHTML

        const modFromManifest = manifest.files.find(element => element.projectID === parseInt(modProjectID))

        const modDownloadURL = modFromManifest.downloadUrl,
            modFileID = modFromManifest.fileID,
            modFilename = modDownloadURL.replace(/^.*\//gm, '')

        const modDownloadResult = await getHTML(modDownloadURL)
        if (!modDownloadResult) {
            document.getElementById('modsList').innerHTML = document.getElementById('modsList').innerHTML + '<li><img id="modImage" src="'+ modImageURL +'"><div class="modInfo"><h1 id="modTitle">'+ modTitle +'</h1><p id="modOwner">Owner: <span>'+ modOwner +'</span></p><p id="modFilename">Filename: <span>'+ modFilename +'</span></p><p id="modSize">Size: <span>0 B</span></p></div><p style="color: rgb(232, 119, 111);" id="modStatus"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgb(232, 119, 111)"><path d="M12.5,11.7928932 L15.1464466,9.14644661 C15.3417088,8.95118446 15.6582912,8.95118446 15.8535534,9.14644661 C16.0488155,9.34170876 16.0488155,9.65829124 15.8535534,9.85355339 L13.2071068,12.5 L15.8535534,15.1464466 C16.0488155,15.3417088 16.0488155,15.6582912 15.8535534,15.8535534 C15.6582912,16.0488155 15.3417088,16.0488155 15.1464466,15.8535534 L12.5,13.2071068 L9.85355339,15.8535534 C9.65829124,16.0488155 9.34170876,16.0488155 9.14644661,15.8535534 C8.95118446,15.6582912 8.95118446,15.3417088 9.14644661,15.1464466 L11.7928932,12.5 L9.14644661,9.85355339 C8.95118446,9.65829124 8.95118446,9.34170876 9.14644661,9.14644661 C9.34170876,8.95118446 9.65829124,8.95118446 9.85355339,9.14644661 L12.5,11.7928932 L12.5,11.7928932 Z M12.5,23 C6.70101013,23 2,18.2989899 2,12.5 C2,6.70101013 6.70101013,2 12.5,2 C18.2989899,2 23,6.70101013 23,12.5 C23,18.2989899 18.2989899,23 12.5,23 Z M12.5,22 C17.7467051,22 22,17.7467051 22,12.5 C22,7.25329488 17.7467051,3 12.5,3 C7.25329488,3 3,7.25329488 3,12.5 C3,17.7467051 7.25329488,22 12.5,22 Z"/></svg>Failed to Download</p></li>'
            document.querySelector('#modsList').scrollTop += 100
            return
        }
        document.getElementById('modsStatus').innerHTML = 'Processed <span>' + ++modCount + '</span> of <span>' + manifest.files.length + '</span> mods'
        let modSize = (<ArrayBuffer>modDownloadResult).byteLength.toString()

        if(modSize.length <= 3) {
            modSize = modSize + ' B'
        } else if (modSize.length > 3 && modSize.length <= 6) {
            modSize = (parseInt(modSize) / 1000).toFixed(0).toString() + ' KB'
        } else {
            modSize = (parseInt(modSize) / 1000000).toFixed(0).toString() + ' MB'
        }

        document.getElementById('modsList').innerHTML = document.getElementById('modsList').innerHTML + '<li><img id="modImage" src="'+ modImageURL +'"><div class="modInfo"><h1 id="modTitle">'+ modTitle +'</h1><p id="modOwner">Owner: <span>'+ modOwner +'</span></p><p id="modFilename">Filename: <span>'+ modFilename +'</span></p><p id="modSize">Size: <span>'+ modSize +'</span></p></div><p style="color: #7eeb60;" id="modStatus"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7eeb60"><path d="M12,22 C6.4771525,22 2,17.5228475 2,12 C2,6.4771525 6.4771525,2 12,2 C17.5228475,2 22,6.4771525 22,12 C22,17.5228475 17.5228475,22 12,22 Z M12,21 C16.9705627,21 21,16.9705627 21,12 C21,7.02943725 16.9705627,3 12,3 C7.02943725,3 3,7.02943725 3,12 C3,16.9705627 7.02943725,21 12,21 Z M15.1464466,9.14644661 C15.3417088,8.95118446 15.6582912,8.95118446 15.8535534,9.14644661 C16.0488155,9.34170876 16.0488155,9.65829124 15.8535534,9.85355339 L10.8535534,14.8535534 C10.6582912,15.0488155 10.3417088,15.0488155 10.1464466,14.8535534 L8.14644661,12.8535534 C7.95118446,12.6582912 7.95118446,12.3417088 8.14644661,12.1464466 C8.34170876,11.9511845 8.65829124,11.9511845 8.85355339,12.1464466 L10.5,13.7928932 L15.1464466,9.14644661 Z"/></svg>Downloaded</p></li>'
        document.querySelector('#modsList').scrollTop += 100

        const folderName = user_folder_location + '\\' + manifest.name + ' ' + manifest.version + '/mods/' + modFilename
        window.require('electron').ipcRenderer.send('writeContents', folderName, Buffer.from((<ArrayBuffer>modDownloadResult)))
    })
})

function getHTML(url: string) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        if (url.includes('forgecdn')) {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onload = function () {
            const status = xhr.status;
            if (status == 200) {
                if (url.includes('forgecdn')) {
                    resolve(xhr.response)
                    return
                }
                resolve(new DOMParser().parseFromString(xhr.responseText, 'text/html'));
            } else {
                reject(status);
            }
        };
        xhr.send();
    });
}
