import { useCallback, useState } from 'react'

import { cn } from '../../../lib/cn'
import { TreeItem } from './tree-item'
import type { TreeViewItem, TreeViewProps } from './tree-view-types'

export function TreeView({
  data,
  className,
  selectedId,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds,
  onSelect,
  onExpand,
  onExpandChange,
  renderItem,
}: TreeViewProps) {
  const [uncontrolledExpandedIds, setUncontrolledExpandedIds] = useState<Set<string>>(
    () => defaultExpandedIds ?? new Set(),
  )

  const isControlled = controlledExpandedIds !== undefined
  const expandedIds = isControlled ? controlledExpandedIds : uncontrolledExpandedIds

  const handleToggle = useCallback(
    (item: TreeViewItem) => {
      const wasExpanded = expandedIds.has(item.id)
      const next = new Set(expandedIds)
      if (wasExpanded) {
        next.delete(item.id)
      } else {
        next.add(item.id)
      }

      if (!isControlled) {
        setUncontrolledExpandedIds(next)
      }
      onExpandChange?.(next)
      onExpand?.(item, !wasExpanded)
    },
    [expandedIds, isControlled, onExpand, onExpandChange],
  )

  return (
    <div className={cn('p-2', className)}>
      {data.map((item) => (
        <TreeItem
          key={item.id}
          item={item}
          depth={0}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onSelect={onSelect}
          onToggle={handleToggle}
          renderItem={renderItem}
        />
      ))}
    </div>
  )
}
