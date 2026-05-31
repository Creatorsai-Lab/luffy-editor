// Static asset imports
declare module '*.webp' { const src: string; export default src }
declare module '*.png'  { const src: string; export default src }
declare module '*.jpg'  { const src: string; export default src }
declare module '*.jpeg' { const src: string; export default src }
declare module '*.svg'  { const src: string; export default src }
declare module '*.gif'  { const src: string; export default src }

export interface ProjectRecord {
  id: string
  name: string
  folder: string
  createdAt: number
  updatedAt: number
}

export interface AssetRecord {
  filename: string
  path: string
}

export interface UploadedAsset {
  id: string
  filename: string
  path: string
}

declare global {
  interface Window {
    api: {
      win: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close:    () => Promise<void>
      }
      projects: {
        list:   ()                         => Promise<ProjectRecord[]>
        create: (name: string)             => Promise<ProjectRecord>
        save:   (id: string, data: string) => Promise<void>
        load:   (id: string)               => Promise<unknown>
        delete: (id: string)               => Promise<void>
        rename: (id: string, name: string) => Promise<void>
      }
      assets: {
        upload: (projectId: string, src: string) => Promise<UploadedAsset>
        list:   (projectId: string)              => Promise<AssetRecord[]>
      }
      dialog: {
        openFile:  (filters: { name: string; extensions: string[] }[]) => Promise<string | null>
        saveVideo: (defaultName: string)                                => Promise<string | null>
        saveImage: (defaultName: string)                                => Promise<string | null>
      }
      fs: {
        writeFile: (path: string, data: Uint8Array) => Promise<void>
      }
      shell: {
        openPath: (path: string) => Promise<string>
      }
    }
  }
}
