import { createBrowserRouter, Outlet } from 'react-router-dom'
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ROLES } from '@/utils/constants'
import { LandingPage } from '@/pages/public/LandingPage'
import { LoginPage, SignupPage } from '@/pages/public/AuthPages'
import { MarketplacePage, ProductPage, StorePage } from '@/pages/public/MarketplacePages'
import { CheckoutPage } from '@/pages/public/CheckoutPage'
import {
  LayoutDashboard,
  Package,
  Wallet,
  MessageSquare,
  User as UserIcon,
  Box,
  BarChart3,
  Store,
  Users,
  PieChart,
  FileText,
  Settings,
  History
} from 'lucide-react'

import {
  AdminApprovals,
  AdminCustomers,
  AdminFinance,
  AdminLogs,
  AdminOrders,
  AdminOverview,
  AdminProducts,
  AdminReports,
  AdminSettings,
  AdminUsers,
  ArtisanAnalytics,
  ArtisanMessages,
  ArtisanOrders,
  ArtisanOverview,
  ArtisanPending,
  ArtisanProducts,
  ArtisanStoreSettings,
  ArtisanWallet,
  CustomerHome,
  CustomerMessages,
  CustomerOrders,
  CustomerProfile,
  CustomerWallet,
  CustomerWishlist,
} from '@/pages/dashboards/DashboardPages'

function Root() {
  useAuthBootstrap()
  return <Outlet />
}

const customerLinks = [
  { to: '/customer', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/customer/orders', label: 'Orders', icon: <Package size={18} /> },
  { to: '/customer/wallet', label: 'Wallet', icon: <Wallet size={18} /> },
  { to: '/customer/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
  { to: '/customer/profile', label: 'Profile', icon: <UserIcon size={18} /> },
]

const artisanLinks = [
  { to: '/artisan', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/artisan/products', label: 'Products', icon: <Box size={18} /> },
  { to: '/artisan/orders', label: 'Orders', icon: <Package size={18} /> },
  { to: '/artisan/wallet', label: 'Wallet', icon: <Wallet size={18} /> },
  { to: '/artisan/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { to: '/artisan/store-settings', label: 'Store Settings', icon: <Store size={18} /> },
  { to: '/artisan/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/approvals', label: 'Approvals', icon: <History size={18} /> },
  { to: '/admin/users', label: 'Artisans Mgt', icon: <Users size={18} /> },
  { to: '/admin/customers', label: 'Customer Mgt', icon: <UserIcon size={18} /> },
  { to: '/admin/finance', label: 'Finance Mgt', icon: <PieChart size={18} /> },
  { to: '/admin/products', label: 'Products', icon: <Box size={18} /> },
  { to: '/admin/logs', label: 'Analytics/Logs', icon: <BarChart3 size={18} /> },
  { to: '/admin/orders', label: 'Orders', icon: <Package size={18} /> },
  { to: '/admin/reports', label: 'Reports', icon: <FileText size={18} /> },
  { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
]

import { PublicLayout } from '@/layouts/PublicLayout'

import { AboutPage, ArtisansPage } from '@/pages/public/InfoPages'
import { Navigate } from 'react-router-dom'

import { CartPage } from '@/pages/public/CartPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: 'marketplace', element: <MarketplacePage /> },
          { path: 'artisans', element: <ArtisansPage /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'product/:productId', element: <ProductPage /> },
          { path: 'store/:storeId', element: <StorePage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'sign-in', element: <Navigate to="/login" replace /> },
          { path: 'signup', element: <SignupPage /> },
        ],
      },
      { path: 'artisan/pending', element: <ArtisanPending /> },
      {
        path: 'customer',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <DashboardLayout title="Customer Dashboard" links={customerLinks} />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <CustomerHome /> },
          { path: 'orders', element: <CustomerOrders /> },
          { path: 'wallet', element: <CustomerWallet /> },
          { path: 'messages', element: <CustomerMessages /> },
          { path: 'profile', element: <CustomerProfile /> },
          { path: 'wishlist', element: <CustomerWishlist /> },
        ],
      },
      {
        path: 'artisan',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ARTISAN]}>
            <DashboardLayout title="Artisan Dashboard" links={artisanLinks} />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ArtisanOverview /> },
          { path: 'products', element: <ArtisanProducts /> },
          { path: 'orders', element: <ArtisanOrders /> },
          { path: 'wallet', element: <ArtisanWallet /> },
          { path: 'analytics', element: <ArtisanAnalytics /> },
          { path: 'store-settings', element: <ArtisanStoreSettings /> },
          { path: 'messages', element: <ArtisanMessages /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <DashboardLayout title="Admin Dashboard" links={adminLinks} />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminOverview /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'customers', element: <AdminCustomers /> },
          { path: 'finance', element: <AdminFinance /> },
          { path: 'products', element: <AdminProducts /> },
          { path: 'logs', element: <AdminLogs /> },
          { path: 'orders', element: <AdminOrders /> },
          { path: 'reports', element: <AdminReports /> },
          { path: 'settings', element: <AdminSettings /> },
          { path: 'approvals', element: <AdminApprovals /> },
        ],
      },
    ],
  },
])
