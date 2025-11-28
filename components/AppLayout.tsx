'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/lib/store';
import { AuthService } from '@/lib/api';
import { IconSidebar } from './IconSidebar';
import { SchemaSidebar } from './SchemaSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, updateProfile } = useAuthStore();
  const { schemaSidebarOpen, schemaSidebarWidth, setSchemaSidebarWidth, setSchemaSidebarOpen, sqlEditorTabs, openTabs } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [toggleButtonPosition, setToggleButtonPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarTogglePosition');
      return saved ? parseFloat(saved) : 50;
    }
    return 50;
  });
  const [isDragging, setIsDragging] = useState(false);

  // Auth routes that don't require authentication
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Only show schema sidebar on specific pages
  const pagesWithSchemaSidebar = ['/sql-editor', '/ai-chat', '/connections'];
  // Hide sidebar when on SQL editor page with no tabs open
  const hideWhenNoTabs = pathname === '/sql-editor' && sqlEditorTabs.filter(tab => openTabs.includes(tab.id)).length === 0;
  const showSchemaSidebar = !isAuthRoute && pagesWithSchemaSidebar.includes(pathname) && schemaSidebarOpen && !hideWhenNoTabs;
  const shouldShowToggleButtons = !isAuthRoute && pagesWithSchemaSidebar.includes(pathname) && !hideWhenNoTabs;

  const handleToggleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleToggleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const viewportHeight = window.innerHeight;
    const minTop = 120;
    const maxTop = viewportHeight - 100;
    
    const clampedY = Math.max(minTop, Math.min(maxTop, clientY));
    const percentage = ((clampedY - minTop) / (maxTop - minTop)) * 80 + 10;
    
    setToggleButtonPosition(percentage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarTogglePosition', percentage.toString());
    }
  };

  const handleToggleMouseUp = () => {
    setIsDragging(false);
  };

  const handleToggleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleToggleTouchMove = (e: TouchEvent) => {
    handleToggleMouseMove(e);
  };

  const handleToggleTouchEnd = () => {
    setIsDragging(false);
  };

  const toggleSidebar = () => {
    setSchemaSidebarOpen(!schemaSidebarOpen);
  };
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    const current = user?.avatar || '';
    const isMock = !current || current.includes('pexels');
    if (!isMock) return;
    let active = true;
    AuthService.getProfile()
      .then((p) => {
        if (!active) return;
        const url = p.profilePictureUrl;
        if (url) updateProfile({ avatar: url });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [mounted, isAuthenticated, user?.avatar]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleToggleMouseMove);
      document.addEventListener('mouseup', handleToggleMouseUp);
      document.addEventListener('touchmove', handleToggleTouchMove, { passive: false });
      document.addEventListener('touchend', handleToggleTouchEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    } else {
      document.removeEventListener('mousemove', handleToggleMouseMove);
      document.removeEventListener('mouseup', handleToggleMouseUp);
      document.removeEventListener('touchmove', handleToggleTouchMove);
      document.removeEventListener('touchend', handleToggleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleToggleMouseMove);
      document.removeEventListener('mouseup', handleToggleMouseUp);
      document.removeEventListener('touchmove', handleToggleTouchMove);
      document.removeEventListener('touchend', handleToggleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  useEffect(() => {
    if (mounted && !isAuthenticated && !isAuthRoute) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthRoute, router, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        {children}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <IconSidebar />
      
      <div className="flex-1 flex min-w-0">
        {showSchemaSidebar ? (
          <PanelGroup direction="horizontal" className="flex-1 min-w-0">
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={40}
              onResize={(size) => {
                setSchemaSidebarWidth((size / 100) * window.innerWidth);
              }}
            >
              <SchemaSidebar />
            </Panel>
            <PanelResizeHandle className="relative w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors duration-200">
              {/* Toggle Button positioned on the resize handle */}
              <div
                className="absolute z-20 cursor-pointer group"
                style={{
                  top: `${toggleButtonPosition}%`,
                  transform: 'translateY(-50%)',
                  left: '3.5px', // Position slightly right of the resizable line
                  right: '-4px', // Extend 4px to the right
                }}
                onMouseDown={handleToggleMouseDown}
                onTouchStart={handleToggleTouchStart}
                onClick={(e) => {
                  if (!isDragging) {
                    e.stopPropagation();
                    toggleSidebar();
                  }
                }}
                title="Collapse sidebar"
              >
                <div className="w-4 h-8 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-200 flex items-center justify-center shadow-sm mx-auto">
                  <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-300 transition-transform duration-200" />
                </div>
                {/* Drag indicator */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </PanelResizeHandle>
            
            <Panel defaultSize={80} minSize={60}>
              <main className="h-full overflow-hidden">
                {children}
              </main>
            </Panel>
            
          </PanelGroup>
        ) : (
          <div className="flex-1 h-full overflow-hidden relative">
            {/* Toggle button for collapsed sidebar */}
            {shouldShowToggleButtons && (
              <div
                className="absolute left-0 z-10 flex items-center justify-center w-4 h-8 bg-white dark:bg-gray-800 border-t border-r border-b border-gray-300 dark:border-gray-600 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                style={{
                  top: `${toggleButtonPosition}%`,
                  transform: 'translateY(-50%)',
                  borderRadius: '4px',
                }}
                onMouseDown={handleToggleMouseDown}
                onTouchStart={handleToggleTouchStart}
                onClick={(e) => {
                  if (!isDragging) {
                    e.stopPropagation();
                    toggleSidebar();
                  }
                }}
                title="Expand sidebar"
              >
               <ChevronRight className="w-3 h-3 text-gray-600 dark:text-gray-300 transition-transform duration-200" />
                
                {/* Drag indicator - only visible on hover */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <GripVertical className="w-1.5 h-1.5 text-gray-400" />
                </div>
              </div>
            )}
            
            <main className="h-full overflow-hidden">
              {children}
            </main>
          </div>
        )}
        
      </div>
    </div>
  );
}