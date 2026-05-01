import { useEditorStore } from '../../store/editorStore'

export default function RightSidebar() {
  const { activePanel } = useEditorStore()

  // Right sidebar is only visible when upload panel is active (shown in LeftSidebar)
  // This placeholder can be extended to show asset library
  return null
}
