import { Outlet, Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-[#f5f5f5] text-[#003580] pt-12 pb-8 px-6 rounded-tl-2xl md:rounded-tl-3xl">
        <div className="mx-auto max-w-7xl">
          {/* Main Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
            {/* Support */}
            <div>
              <h4 className="font-bold text-sm mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Help Center</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Contact Customer Service</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Safety Resource Center</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Delivery Information</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Returns & Refunds</a></li>
              </ul>
            </div>

            {/* Discover */}
            <div>
              <h4 className="font-bold text-sm mb-4">Discover</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Artisan Stories</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Seasonal Collections</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Gift Cards</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">AMP for Business</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Artisan Awards</a></li>
              </ul>
            </div>

            {/* Terms and settings */}
            <div>
              <h4 className="font-bold text-sm mb-4">Terms and settings</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Privacy Notice</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Terms of Service</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Accessibility Statement</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Artisan Agreement</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Modern Slavery Statement</a></li>
              </ul>
            </div>

            {/* Partners */}
            <div>
              <h4 className="font-bold text-sm mb-4">Partners</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Artisan Login</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Partner Help</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">List your products</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Become an Affiliate</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Logistic Partners</a></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="font-bold text-sm mb-4">About</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs hover:underline text-[#003580]">About AMP</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">How We Work</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Sustainability</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Press Center</a></li>
                <li><a href="#" className="text-xs hover:underline text-[#003580]">Careers</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="pt-8 border-t border-black/5 text-center space-y-4">
            <p className="text-[10px] text-black/40">
              Copyright © 2026 Artisan Marketplace Platform (AMP). All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
