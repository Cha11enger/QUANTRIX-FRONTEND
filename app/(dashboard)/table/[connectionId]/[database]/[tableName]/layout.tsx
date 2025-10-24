'use client';

import { ReactNode } from 'react';
import { SchemaSidebar } from '@/components/SchemaSidebar';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export default function TableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <PanelGroup direction="horizontal" className="flex-1 min-w-0">
        <Panel
          defaultSize={20}
          minSize={15}
          maxSize={40}
        >
          <SchemaSidebar />
        </Panel>
        <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors duration-200" />
        
        <Panel defaultSize={80} minSize={60}>
          <main className="h-full overflow-hidden">
            {children}
          </main>
        </Panel>
      </PanelGroup>
    </div>
  );
}