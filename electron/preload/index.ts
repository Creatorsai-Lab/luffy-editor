import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  win: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    maximize: () => ipcRenderer.invoke('win:maximize'),
    close:    () => ipcRenderer.invoke('win:close')
  },
  projects: {
    list:   ()                         => ipcRenderer.invoke('projects:list'),
    create: (name: string)             => ipcRenderer.invoke('projects:create', name),
    save:   (id: string, data: string) => ipcRenderer.invoke('projects:save', id, data),
    load:   (id: string)               => ipcRenderer.invoke('projects:load', id),
    delete: (id: string)               => ipcRenderer.invoke('projects:delete', id),
    rename: (id: string, name: string) => ipcRenderer.invoke('projects:rename', id, name)
  },
  assets: {
    upload: (projectId: string, src: string) => ipcRenderer.invoke('assets:upload', projectId, src),
    list:   (projectId: string)              => ipcRenderer.invoke('assets:list', projectId)
  },
  dialog: {
    openFile:  (filters: { name: string; extensions: string[] }[]) => ipcRenderer.invoke('dialog:open-file', filters),
    saveVideo: (defaultName: string)                                => ipcRenderer.invoke('dialog:save-video', defaultName)
  },
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (e) { console.error(e) }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
