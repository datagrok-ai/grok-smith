import type { ReactNode } from 'react'

export interface TreeViewItem {
  id: string
  name: string
  icon?: ReactNode
  children?: TreeViewItem[]
}

export interface TreeViewProps {
  data: TreeViewItem[]
  className?: string
  selectedId?: string | null
  expandedIds?: Set<string>
  defaultExpandedIds?: Set<string>
  onSelect?: (item: TreeViewItem) => void
  onExpand?: (item: TreeViewItem, expanded: boolean) => void
  onExpandChange?: (expandedIds: Set<string>) => void
  renderItem?: (item: TreeViewItem, depth: number) => ReactNode
}
