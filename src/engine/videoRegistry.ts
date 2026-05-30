const registry = new Map<string, HTMLVideoElement>()

export const videoRegistry = {
  register:   (id: string, video: HTMLVideoElement) => registry.set(id, video),
  unregister: (id: string) => registry.delete(id),
  get:        (id: string) => registry.get(id),
}
