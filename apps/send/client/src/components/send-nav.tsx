import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Studies', href: '/' },
  { label: 'Upload', href: '/upload' },
]

export function SendNav() {
  const location = useLocation()

  return (
    <nav className="p-2">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={`flex items-center rounded px-3 py-1.5 text-sm hover:bg-muted ${
            location.pathname === item.href
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
