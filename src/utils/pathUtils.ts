/**
 * Utility functions for handling file paths across platforms
 */

/**
 * Converts a file system path to a file:// URL
 * Handles Windows paths (C:\path\to\file) and Unix paths (/path/to/file)
 */
export function toFileUrl(path: string): string {
  if (!path) return ''
  
  // Already a proper URL
  if (path.startsWith('file://') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  
  // Windows path (C:\path\to\file or C:/path/to/file)
  if (path.match(/^[A-Za-z]:[\\\/]/)) {
    const normalized = path.replace(/\\/g, '/')
    return `file:///${normalized}`
  }
  
  // Unix path (/path/to/file)
  if (path.startsWith('/')) {
    return `file://${path}`
  }
  
  // Relative path - treat as relative to file system
  return `file://${path}`
}

/**
 * Converts a file:// URL back to a file system path
 */
export function fromFileUrl(url: string): string {
  if (!url) return ''
  
  if (!url.startsWith('file://')) {
    return url
  }
  
  // Remove file:// prefix
  let path = url.slice(7)
  
  // Handle Windows paths (file:///C:/path becomes C:/path)
  if (path.match(/^[A-Za-z]:[\\\/]/)) {
    return path
  }
  
  // Handle Windows paths with triple slash (file:///C:\path)
  if (path.match(/^\/[A-Za-z]:[\\\/]/)) {
    return path.slice(1)
  }
  
  return path
}
