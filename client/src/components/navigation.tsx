import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ScanLine, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navigationItems = [
    { href: "/upload", label: "Upload", dataTab: "upload" },
    { href: "/results", label: "Results", dataTab: "results" },
    { href: "/dashboard", label: "Dashboard", dataTab: "dashboard" },
    { href: "/admin", label: "Admin", dataTab: "admin" },
  ];

  const isActiveTab = (href: string) => {
    if (href === "/upload" && (location === "/" || location === "/upload")) {
      return true;
    }
    return location.startsWith(href) && href !== "/";
  };

  return (
    <nav className="bg-surface shadow-material-2 sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <ScanLine className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-medium text-text-primary">OMR Scan Pro</h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium border-b-2 transition-colors ${
                      isActiveTab(item.href)
                        ? "text-primary border-primary"
                        : "text-text-secondary hover:text-primary border-transparent"
                    }`}
                    data-testid={`nav-link-${item.dataTab}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 rounded-full text-text-secondary hover:text-primary hover:bg-gray-100 transition-colors"
                data-testid="notification-button"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <div className="ml-3 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  data-testid="user-menu-button"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-text-secondary hover:text-primary hover:bg-gray-100"
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-t border-gray-200" data-testid="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActiveTab(item.href)
                    ? "text-primary bg-primary bg-opacity-10"
                    : "text-text-secondary hover:text-primary hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid={`mobile-nav-link-${item.dataTab}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
