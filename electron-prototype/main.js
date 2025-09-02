const { app, BrowserWindow, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let mainWindow
let pythonProcess

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'VibeVirtuoso - Gesture Controlled Music'
  })

  // Load your React app (you can build and serve it locally)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3001')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile('renderer/index.html')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    // Clean up Python processes
    if (pythonProcess) {
      pythonProcess.kill()
    }
  })
}

// Python Integration
ipcMain.handle('start-gesture-detection', async (event, instrument = 'piano') => {
  try {
    console.log(`Starting gesture detection for ${instrument}`)
    
    // Kill existing process if running
    if (pythonProcess) {
      pythonProcess.kill()
    }

    // Start the brilliant Python script directly
    const pythonScript = path.join(__dirname, '../backend/scripts/gesture_piano.py')
    pythonProcess = spawn('python3', [pythonScript], {
      cwd: path.join(__dirname, '../backend'),
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Handle Python output
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(`Python: ${output}`)
      
      // Parse gesture events and send to renderer
      if (output.includes('🎹 Piano') || output.includes('🎻 Strings')) {
        mainWindow.webContents.send('gesture-detected', {
          type: 'audio_played',
          message: output.trim()
        })
      }
    })

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`)
    })

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`)
      mainWindow.webContents.send('gesture-detection-stopped', code)
    })

    return { success: true, message: 'Gesture detection started' }
  } catch (error) {
    console.error('Failed to start gesture detection:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stop-gesture-detection', async () => {
  try {
    if (pythonProcess) {
      pythonProcess.kill()
      pythonProcess = null
    }
    return { success: true, message: 'Gesture detection stopped' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('switch-instrument', async (event, instrument) => {
  try {
    console.log(`Switching to ${instrument}`)
    
    // For now, restart with new instrument
    // TODO: Implement hot-swapping via Python script communication
    if (pythonProcess) {
      pythonProcess.kill()
    }
    
    // Start new instrument script
    const instrumentScripts = {
      'piano': 'gesture_piano.py',
      'drums': 'gesture_drums.py',
      'guitar': 'gesture_guitar.py',
      'flute': 'gesture_flute.py',
      'violin': 'gesture_violin.py',
      'saxophone': 'gesture_sax_player.py'
    }
    
    const scriptName = instrumentScripts[instrument] || 'gesture_piano.py'
    const pythonScript = path.join(__dirname, '../backend/scripts', scriptName)
    
    pythonProcess = spawn('python3', [pythonScript], {
      cwd: path.join(__dirname, '../backend'),
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Handle output same as before
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString()
      mainWindow.webContents.send('gesture-detected', {
        type: 'audio_played',
        message: output.trim(),
        instrument: instrument
      })
    })

    return { success: true, instrument: instrument }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
})