export function toFileUrl(path: string): string {
  if (!path) return ''
  if (
    path.startsWith('localasset://') ||
    path.startsWith('file://') ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) return path

  // Windows: C:\path or C:/path
  if (path.match(/^[A-Za-z]:[\\\/]/)) {
    return `localasset:///${path.replace(/\\/g, '/')}`
  }

  // Unix absolute
  if (path.startsWith('/')) return `localasset:///${path.slice(1)}`

  return `localasset:///${path}`
}

export function fromFileUrl(url: string): string {
  if (!url) return ''
  for (const prefix of ['localasset:///', 'file:///']) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length)
      // Windows: restore drive letter
      if (path.match(/^[A-Za-z]:\//)) return path
      return `/${path}`
    }
  }
  if (url.startsWith('file://')) return url.slice(7)
  return url
}
