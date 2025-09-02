const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Gesture control
  startGestureDetection: (instrument) => ipcRenderer.invoke('start-gesture-detection', instrument),
  stopGestureDetection: () => ipcRenderer.invoke('stop-gesture-detection'),
  switchInstrument: (instrument) => ipcRenderer.invoke('switch-instrument', instrument),
  
  // Event listeners
  onGestureDetected: (callback) => ipcRenderer.on('gesture-detected', callback),
  onGestureDetectionStopped: (callback) => ipcRenderer.on('gesture-detection-stopped', callback),
  
  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})

// Security: Remove Node.js from renderer
delete window.require
delete window.exports
delete window.module