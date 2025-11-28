'use client';

import { useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Plus, X, FileText, Copy, Trash2, MoveHorizontal as MoreHorizontal } from 'lucide-react';

interface SQLEditorTabsProps {
  tabContextMenus: { [key: string]: boolean };
  setTabContextMenus: (menus: { [key: string]: boolean }) => void;
  onNewTab: () => void;
  onCloseTab: (tabId: string, e?: React.MouseEvent) => void;
  onTabContextMenu: (e: React.MouseEvent, tabId: string) => void;
  onDeleteWorksheet: (tabId: string) => void;
  onDuplicateTab: (tabId: string) => void;
}

export function SQLEditorTabs({
  tabContextMenus,
  setTabContextMenus,
  onNewTab,
  onCloseTab,
  onTabContextMenu,
  onDeleteWorksheet,
  onDuplicateTab
}: SQLEditorTabsProps) {
  const { sqlEditorTabs, activeSqlTab, setActiveSqlTab, openTabs } = useAppStore();
  const openTabsList = sqlEditorTabs.filter(tab => openTabs.includes(tab.id));

  if (openTabsList.length === 0) {
    return null;
  }

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center relative">
        <div className="flex items-center overflow-x-auto tabs-scroll tabs-scroll-width pr-14">
          {openTabsList.map((tab) => (
            <div key={tab.id} className="relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveSqlTab(tab.id)}
                onContextMenu={(e) => onTabContextMenu(e, tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeSqlTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium truncate max-w-[160px]">{tab.name}</span>
                <span
                  onClick={(e) => onCloseTab(tab.id, e as any)}
                  className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              </div>

              {/* Tab Context Menu */}
              {tabContextMenus[tab.id] && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                  <div className="p-1">
                    <button
                      onClick={() => onDuplicateTab(tab.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => onDeleteWorksheet(tab.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="absolute right-0 top-0 h-full w-14 bg-white dark:bg-gray-800 z-30 flex items-center justify-center">
          <button
            onClick={onNewTab}
            className="z-40 flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
            aria-label="New tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}