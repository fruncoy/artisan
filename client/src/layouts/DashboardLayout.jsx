import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { 
  LayoutDashboard, 
  Menu, 
  X, 
  Bell, 
  MessageSquare, 
  LogOut,
  ChevronDown,
  Sparkles,
  User as UserIcon,
  Search,
  Plus,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export function DashboardLayout({ title: layoutTitle, links }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, originalUser, stopImpersonating, signOut } = useAuthStore()
  const location = useLocation()

  const currentPathLabel = useMemo(() => {
    const activeLink = links.find(link => location.pathname === link.to)
    if (activeLink) return activeLink.label
    
    // Handle subpaths (e.g., /admin/users/123)
    const sortedLinks = [...links].sort((a, b) => b.to.length - a.to.length)
    const matchedLink = sortedLinks.find(link => location.pathname.startsWith(link.to))
    return matchedLink ? matchedLink.label : layoutTitle
  }, [location.pathname, links, layoutTitle])

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E2E8F0] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-8 py-6">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tighter text-[#003580] uppercase">AMP</span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#64748B] hover:text-[#1C2434]"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <ul className="space-y-1">
              {links.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to.split('/').length <= 2}
                  >
                    {({ isActive }) => (
                      <div className={`group flex items-center gap-3.5 rounded-md px-4 py-3 font-bold transition-all ${ 
                        isActive 
                          ? 'bg-[#F1F5F9] text-[#003580] shadow-sm' 
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1C2434]'
                      }`}>
                        {item.icon && (
                          <span className={isActive ? 'text-[#003580]' : 'text-[#64748B] group-hover:text-[#1C2434]'}>
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#E2E8F0]">
            <button 
              onClick={signOut}
              className="flex w-full items-center gap-3.5 rounded-md px-4 py-3 font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#DC3545] transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Impersonation Banner */}
        {originalUser && (
          <div className="bg-[#003580] text-white px-6 py-2.5 flex items-center justify-between shadow-lg z-50 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <ShieldAlert size={18} className="text-[#ffc107]" />
              </div>
              <div className="text-sm">
                <span className="font-medium opacity-80">Admin Mode:</span>
                <span className="ml-2 font-black tracking-tight">Impersonating {user.displayName || user.email}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                stopImpersonating()
                if (window.name === 'ImpersonationPopup') {
                  window.close()
                }
              }}
              className="flex items-center gap-2 bg-[#ffc107] hover:bg-[#ffc107]/90 text-[#1C2434] px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <ArrowLeft size={14} />
              Return to Admin
            </button>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 w-full bg-white shadow-sm border-b border-[#E2E8F0]">
          <div className="flex flex-1 items-center justify-between px-4 md:px-8">
            {/* Left: Mobile Menu */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-md transition-all"
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Right: Notifications & Profile */}
            <div className="flex flex-1 items-center justify-end gap-3 md:gap-5">
              <div className="flex items-center gap-2 border-r border-[#E2E8F0] pr-3 md:pr-5">
                <button className="relative p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-all">
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 size-2 bg-[#DC3545] rounded-full border-2 border-white"></span>
                </button>
                <button className="relative p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-all">
                  <MessageSquare size={20} />
                  <span className="absolute top-1.5 right-1.5 size-2 bg-[#ff5e14] rounded-full border-2 border-white"></span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-[#1C2434] leading-tight">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs font-medium text-[#64748B] capitalize">
                    {user?.role}
                  </p>
                </div>
                <div className="size-12 rounded-full bg-[#E2E8F0] flex items-center justify-center overflow-hidden border border-[#E2E8F0]">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="profile" className="size-full object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-[#64748B]" />
                  )}
                </div>
                <ChevronDown size={16} className="text-[#64748B] cursor-pointer" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <div className="mx-auto max-w-screen-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#1C2434]">{currentPathLabel}</h2>
              <nav>
                <ol className="flex items-center gap-2">
                  <li>
                    <Link to={user?.role === 'admin' ? '/admin' : user?.role === 'artisan' ? '/artisan' : '/customer'} className="text-sm font-medium text-[#64748B] hover:text-[#003580]">Dashboard /</Link>
                  </li>
                  <li className="text-sm font-medium text-[#003580]">{currentPathLabel}</li>
                </ol>
              </nav>
            </div>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}
    </div>
  )
}
