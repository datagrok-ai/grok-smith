import { useCallback } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'

import { cn } from '../../../lib/cn'
import type { TreeViewItem } from './tree-view-types'

interface TreeItemProps {
  item: TreeViewItem
  depth: number
  selectedId?: string | null
  expandedIds: Set<string>
  onSelect?: (item: TreeViewItem) => void
  onToggle: (item: TreeViewItem) => void
  renderItem?: (item: TreeViewItem, depth: number) => React.ReactNode
}

export function TreeItem({
  item,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  renderItem,
}: TreeItemProps) {
  const hasChildren = item.children !== undefined && item.children.length > 0
  const isExpandable = item.children === undefined || hasChildren
  const isExpanded = expandedIds.has(item.id)
  const isSelected = selectedId === item.id
  const isLoading = item.children === undefined && isExpanded

  const handleClick = useCallback(() => {
    onSelect?.(item)
  }, [item, onSelect])

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggle(item)
    },
    [item, onToggle],
  )

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex w-full items-center rounded px-2 py-1 text-sm hover:bg-muted',
          isSelected
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse chevron */}
        {isExpandable ? (
          <span
            className="mr-1 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground"
            onClick={handleToggle}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              className={cn(
                'transition-transform duration-150',
                isExpanded && 'rotate-90',
              )}
            >
              <path d="M3 1l5 4-5 4V1z" />
            </svg>
          </span>
        ) : (
          <span className="mr-1 h-4 w-4 shrink-0" />
        )}

        {/* Icon */}
        {item.icon && <span className="mr-1.5 shrink-0">{item.icon}</span>}

        {/* Label */}
        {renderItem ? (
          renderItem(item, depth)
        ) : (
          <span className="truncate">{item.name}</span>
        )}
      </button>

      {/* Children */}
      {isExpandable && (
        <Collapsible.Root open={isExpanded}>
          <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
            {isLoading && (
              <div
                className="px-2 py-1 text-xs text-muted-foreground"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                Loading...
              </div>
            )}
            {item.children?.map((child) => (
              <TreeItem
                key={child.id}
                item={child}
                depth={depth + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
                renderItem={renderItem}
              />
            ))}
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </div>
  )
}
