const { app, BrowserWindow, ipcMain } = require('electron/main')

const path = require('node:path')
const fs = require('node:fs/promises')

// Quit when Squirrel launches the app during Windows install/uninstall
if (require('electron-squirrel-startup')) app.quit()

const todosFile = () => path.join(app.getPath('userData'), 'todos.json')

const loadTodos = async () => {
  try {
    return JSON.parse(await fs.readFile(todosFile(), 'utf8'))
  } catch {
    return []
  }
}

// Chain writes so two quick saves can't interleave and corrupt the file
let pendingSave = Promise.resolve()
const saveTodos = (todos) => {
  pendingSave = pendingSave
    .catch(() => {})
    .then(() => fs.writeFile(todosFile(), JSON.stringify(todos, null, 2)))
  return pendingSave
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 480,
    height: 640,
    minWidth: 360,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  ipcMain.handle('todos:load', loadTodos)
  ipcMain.handle('todos:save', (event, todos) => saveTodos(todos))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
