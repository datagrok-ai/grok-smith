import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Studies', to: '.', end: true },
  { label: 'Upload', to: 'upload', end: false },
]

export function SendNav() {
  return (
    <nav className="p-2">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center rounded px-3 py-1.5 text-sm hover:bg-muted ${
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
