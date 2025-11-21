'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { mockQueryResults } from '@/lib/data';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileText, Plus } from 'lucide-react';
import Editor from '@monaco-editor/react';
// Removed header per request
import { SQLEditorTabs } from '@/components/sql-editor/SQLEditorTabs';
import { SQLEditorResults } from '@/components/sql-editor/SQLEditorResults';

export default function SQLEditorPage() {
  const { 
    sqlEditorTabs, 
    activeSqlTab, 
    setActiveSqlTab, 
    addSqlTab, 
    removeSqlTab, 
    updateSqlTab,
    openTabs,
    deleteWorksheet,
    activeConnection
  } = useAppStore();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [tabContextMenus, setTabContextMenus] = useState<{ [key: string]: boolean }>({});

  // Bottom panel state
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(true);
  const editorRef = useRef<any>(null);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  const activeTab = sqlEditorTabs.find(tab => tab.id === activeSqlTab);

  const handleExecuteQuery = async (mode?: 'run' | 'runSelected' | 'runAll') => {
    if (!activeTab?.content.trim()) return;
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const endTime = Date.now();
    const execTime = (endTime - startTime) / 1000;
    
    const editor = editorRef.current;
    let text = activeTab.content;
    if (editor && mode === 'runSelected') {
      const sel = editor.getSelection();
      if (sel) {
        text = editor.getModel()?.getValueInRange(sel) || text;
      }
    }
    // Mock results based on query content
    const key = text.trim().toLowerCase();
    const results = mockQueryResults[key] || {
      columns: ['ID', 'NAME', 'EMAIL'],
      rows: [
        { ID: '1', NAME: 'John Doe', EMAIL: 'john@example.com' },
        { ID: '2', NAME: 'Jane Smith', EMAIL: 'jane@example.com' }
      ],
      executionTime: execTime,
      rowCount: 2
    };
    
    setQueryResults(results);
    setExecutionTime(execTime);
    setIsExecuting(false);
    setBottomPanelCollapsed(false); // Show results panel when query executes
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeSqlTab && value !== undefined) {
      updateSqlTab(activeSqlTab, value);
    }
  };

  const handleNewTab = () => {
    addSqlTab({
      name: `Query ${sqlEditorTabs.length + 1}`,
      content: '-- New query\nSELECT * FROM your_table;',
      connectionId: activeConnection || undefined
    });
  };

  const handleCloseTab = (tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    removeSqlTab(tabId);
  };

  const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setTabContextMenus({ [tabId]: true });
  };

  const handleDeleteWorksheet = (tabId: string) => {
    deleteWorksheet(tabId);
    setTabContextMenus({});
  };

  const handleDuplicateTab = (tabId: string) => {
    const tab = sqlEditorTabs.find(t => t.id === tabId);
    if (tab) {
      addSqlTab({
        name: `${tab.name} (Copy)`,
        content: tab.content,
        connectionId: tab.connectionId
      });
    }
    setTabContextMenus({});
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      

      {/* Tabs */}
      <SQLEditorTabs
        tabContextMenus={tabContextMenus}
        setTabContextMenus={setTabContextMenus}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onTabContextMenu={handleTabContextMenu}
        onDeleteWorksheet={handleDeleteWorksheet}
        onDuplicateTab={handleDuplicateTab}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {sqlEditorTabs.filter(tab => openTabs.includes(tab.id)).length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No worksheets open
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a new worksheet to start writing SQL queries
              </p>
              <button
                onClick={handleNewTab}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mx-auto"
              >
                <Plus className="w-4 h-4" />
                New Worksheet
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Editor */}
            <PanelGroup direction="vertical" className="flex-1">
              {/* Editor Panel */}
              <Panel defaultSize={bottomPanelCollapsed ? 100 : 60} minSize={30}>
                <div className="h-full bg-white dark:bg-gray-800">
                  <Editor
                    height="100%"
                    defaultLanguage="sql"
                    value={activeTab?.content || ''}
                    onChange={handleEditorChange}
                    onMount={(editor) => {
                      editorRef.current = editor;
                      editor.onDidChangeCursorPosition((e: any) => {
                        setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                      });
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </Panel>

              {/* Resizable Handle */}
              {!bottomPanelCollapsed && (
                <PanelResizeHandle className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors duration-200" />
              )}

              {/* Bottom Panel - Results & History */}
              {!bottomPanelCollapsed && (
                <Panel defaultSize={40} minSize={20} maxSize={70}>
                  <SQLEditorResults
                    queryResults={queryResults}
                    executionTime={executionTime}
                    bottomPanelCollapsed={bottomPanelCollapsed}
                    setBottomPanelCollapsed={setBottomPanelCollapsed}
                  />
                </Panel>
              )}
            </PanelGroup>

            {/* Collapsed Panel Indicator */}
            {bottomPanelCollapsed && (
              <SQLEditorResults
                queryResults={queryResults}
                executionTime={executionTime}
                bottomPanelCollapsed={bottomPanelCollapsed}
                setBottomPanelCollapsed={setBottomPanelCollapsed}
              />
            )}
            <div className="flex-shrink-0 h-8 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-gray-300">Ln {cursorPos.line}, Col {cursorPos.col}</span>
                <span className="text-gray-500 dark:text-gray-400">Spaces: 2</span>
                <span className="text-gray-500 dark:text-gray-400">SQL</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                {activeConnection && <span>Conn: {activeConnection}</span>}
                {queryResults && (
                  <span>{queryResults.rowCount} rows • {executionTime?.toFixed(2)}s</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}