'use client';

import { ReactNode } from 'react';
import { IconSidebar } from '@/components/IconSidebar';
import { SchemaSidebar } from '@/components/SchemaSidebar';
import { useAppStore } from '@/lib/store';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TableLayoutProps {
  children,
}

export default function TableLayout({
  children,
}: TableLayoutProps & {
  children: React.ReactNode;
}) {
  const { schemaSidebarOpen, setSchemaSidebarOpen } = useAppStore();
  const [toggleButtonPosition, setToggleButtonPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarTogglePosition');
      return saved ? parseFloat(saved) : 50;
    }
    return 50;
  });
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <IconSidebar />
      
      <div className="flex-1 flex min-w-0">
        {schemaSidebarOpen ? (
          <PanelGroup direction="horizontal" className="flex-1 min-w-0">
            <Panel
              defaultSize={20}
              minSize={15}
              maxSize={40}
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
                  left: '3.5px',
                  right: '-4px',
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
              
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <GripVertical className="w-1.5 h-1.5 text-gray-400" />
              </div>
            </div>
            
            <main className="h-full overflow-hidden">
              {children}
            </main>
          </div>
        )}
        
      </div>
    </div>
  );
}