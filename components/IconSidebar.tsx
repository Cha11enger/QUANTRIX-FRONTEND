'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Database, Chrome as Home, Code, MessageSquare, Settings, Sun, Moon, LogOut, Menu, X, ChevronDown, ChevronRight, Check, User, Copy } from 'lucide-react';
import { useAuthStore, useAppStore } from '@/lib/store';
import { mockConnections } from '@/lib/data';
import { useState, useCallback, useMemo, forwardRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Connections', href: '/connections', icon: Database },
  { name: 'SQL Editor', href: '/sql-editor', icon: Code },
  { name: 'AI Chat', href: '/ai-chat', icon: MessageSquare },
];

// Separate component for the role dropdown to isolate state changes
const RoleDropdown = forwardRef<HTMLButtonElement, {
  user: any;
  currentRole: string;
  setCurrentRole: (role: string) => void;
  availableRoles: string[];
  setRoleDropdownOpen: (open: boolean) => void;
}>(({ user, currentRole, setCurrentRole, availableRoles, setRoleDropdownOpen }, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Memoize filtered roles to prevent unnecessary recalculations
  const filteredRoles = useMemo(() => {
    return availableRoles.filter(role =>
      role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableRoles, searchTerm]);
  
  // Memoize the search handler to prevent unnecessary re-renders
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);
  
  const handleRoleSelect = useCallback((role: string) => {
    setCurrentRole(role);
    setSearchTerm('');
    setRoleDropdownOpen(false);
  }, [setCurrentRole, setRoleDropdownOpen]);

  return (
    <div className="py-1">
      <div className="px-3 py-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Run as role...
        </p>
      </div>
      <Command className="bg-transparent">
        <CommandInput
          placeholder="Search roles..."
          value={searchTerm}
          onValueChange={handleSearchChange}
          className="h-8"
        />
        <CommandList className="max-h-60">
          <CommandEmpty>No roles found.</CommandEmpty>
          <CommandGroup>
            {filteredRoles.map((role) => (
              <CommandItem
                key={role}
                onSelect={() => handleRoleSelect(role)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Database className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-900 dark:text-white">{role}</span>
                  </div>
                  {currentRole === role && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-blue-600 dark:text-blue-400">Default</span>
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
});

RoleDropdown.displayName = 'RoleDropdown';

export function IconSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuthStore();
  const { activeConnection, currentRole, setCurrentRole } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  
  // Get available roles from the active connection
  const activeConn = mockConnections.find(conn => conn.id === activeConnection);
  const availableRoles = activeConn?.snowflakeContext?.roles || ['ACCOUNTADMIN', 'SYSADMIN', 'USERADMIN', 'SECURITYADMIN', 'PUBLIC', 'ORGADMIN', 'SNOWFLAKE_LEARNING_ROLE'];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const NavContent = () => (
    <>
      <div className="flex flex-col items-center py-6 space-y-6">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          DB
        </div>

        {/* Navigation */}
        <nav className="flex flex-col space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`
                  relative group p-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                title={item.name}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center space-y-4 pb-6">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Role Switching Dropdown */}
        <DropdownMenu open={profileDropdownOpen} onOpenChange={setProfileDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="group relative p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              {user?.avatar ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                <ChevronDown className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            side="top" 
            className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
            sideOffset={12}
          >
            {/* User Info Header */}
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Switch Role with Submenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">Switch Role</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="start"
                className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                sideOffset={4}
              >
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Run as role...
                  </p>
                </div>
                <Command className="bg-transparent">
                  <CommandInput
                    placeholder="Search roles..."
                    className="h-8"
                  />
                  <CommandList className="max-h-60">
                    <CommandEmpty>No roles found.</CommandEmpty>
                    <CommandGroup>
                      {availableRoles.map((role) => (
                        <CommandItem
                          key={role}
                          onSelect={() => {
                            setCurrentRole(role);
                            setProfileDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <Database className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-gray-900 dark:text-white">{role}</span>
                            </div>
                            {currentRole === role && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-blue-600 dark:text-blue-400">Default</span>
                                <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Account Section */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">🏢</span>
                    </div>
                    <div>
                      <span className="text-gray-900 dark:text-white">Account</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">RQB55567</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="start"
                className="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                sideOffset={4}
              >
                <div className="p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">TRCSVVO</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">RQB55567</span>
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        RANJITHRJ - 🇺🇸 US West (Oregon)
                      </p>
                      <button 
                        onClick={() => {
                          setAccountDetailsOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View account details
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span>Sign Into Another Account</span>
                    </button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Settings */}
            <DropdownMenuItem 
              onClick={() => {
                router.push('/settings');
                setProfileDropdownOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-white">Settings</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-16 bg-white dark:bg-gray-800 flex-col justify-between">
        <NavContent />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
      >
        {mobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between z-50">
            <NavContent />
          </div>
        </>
      )}

      {/* Account Details Modal */}
      {accountDetailsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Account Details</h2>
                <button
                  onClick={() => setAccountDetailsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-blue-400">Account</span>
                  <div className="flex-1 h-1 bg-gray-700 rounded">
                    <div className="h-1 bg-red-500 rounded" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Account Details Table */}
                <div className="space-y-4">
                  {[
                    { name: 'Account identifier', value: 'TRCSVVO-RQB55567', hasIcon: true },
                    { name: 'Data sharing account identifier', value: 'TRCSVVO.RQB55567', hasIcon: true },
                    { name: 'Organization name', value: 'TRCSVVO', hasIcon: true },
                    { name: 'Account name', value: 'RQB55567', hasIcon: true },
                    { name: 'Account/Server URL', value: 'TRCSVVO-RQB55567.snowflakecomputing.com', hasIcon: true },
                    { name: 'Login name', value: 'RANJITHRJ', hasIcon: true },
                    { name: 'Role', value: 'ACCOUNTADMIN', hasIcon: true },
                    { name: 'Account locator', value: 'KEB70244', hasIcon: true },
                    { name: 'Cloud platform', value: 'AWS', hasIcon: true },
                    { name: 'Edition', value: 'Enterprise', hasIcon: true }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-300 font-medium">{item.name}</span>
                        {item.hasIcon && (
                          <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                            <span className="text-xs text-gray-400">?</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-mono">{item.value}</span>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex items-center justify-between">
              <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Learn more
              </button>
              <button
                onClick={() => setAccountDetailsOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}