import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

/**
 * Auto-saves editor state to history whenever isDirty changes
 * Uses debouncing to avoid saving too frequently
 */
export function useHistoryAutoSave(debounceMs: number = 500) {
  const { isDirty, saveHistory } = useEditorStore()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isDirty) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to save after debounce period
    timeoutRef.current = setTimeout(() => {
      console.log('[useHistoryAutoSave] Saving to history')
      saveHistory('Edit')
      useEditorStore.setState({ isDirty: false })
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isDirty, saveHistory, debounceMs])
}
