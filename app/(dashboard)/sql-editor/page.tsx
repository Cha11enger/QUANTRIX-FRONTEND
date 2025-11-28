'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { mockQueryResults } from '@/lib/data';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileText, Plus, PanelLeft, PanelRight, PanelBottomOpen, X, MessageSquare } from 'lucide-react';
import Editor from '@monaco-editor/react';
// Removed header per request
import { SQLEditorTabs } from '@/components/sql-editor/SQLEditorTabs';
import { SQLEditorResults } from '@/components/sql-editor/SQLEditorResults';
import { ChatInterface } from '@/components/ai-chat/ChatInterface';
import { mockConnections, mockChatHistory } from '@/lib/data';

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
    activeConnection,
    schemaSidebarOpen,
    setSchemaSidebarOpen
  } = useAppStore();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [tabContextMenus, setTabContextMenus] = useState<{ [key: string]: boolean }>({});

  // Bottom panel state
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(true);
  const editorRef = useRef<any>(null);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [messages, setMessages] = useState(mockChatHistory);
  const [isTyping, setIsTyping] = useState(false);
  const [chatPanelCollapsed, setChatPanelCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatPanelCollapsed');
      if (saved === 'true') return true;
      if (saved === 'false') return false;
    }
    return true;
  });
  const [chatPanelSizePct, setChatPanelSizePct] = useState(30);
  const currentConnection = mockConnections.find(conn => conn.id === activeConnection);
  const [searchQuery, setSearchQuery] = useState('');

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

  const generateAIResponse = (question: string, connection: any) => {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('top') && lowerQuestion.includes('customer')) {
      return `Based on your ${connection?.name || 'database'}, here's a query to get the top customers by order value:\n\n\`\`\`sql\nSELECT \n    c.NAME,\n    c.EMAIL,\n    SUM(o.AMOUNT) as total_value,\n    COUNT(o.ID) as order_count\nFROM CUSTOMERS c\nJOIN ORDERS o ON c.ID = o.CUSTOMER_ID\nWHERE o.STATUS = 'completed'\nGROUP BY c.ID, c.NAME, c.EMAIL\nORDER BY total_value DESC\nLIMIT 10;\n\`\`\`\n\nThis query joins customers with their orders and calculates the total value for each customer, filtering for completed orders only.`;
    }
    if (lowerQuestion.includes('table') || lowerQuestion.includes('schema')) {
      const tables = connection?.schema?.tables || [];
      const tableList = tables.map((t: any) => `- **${t.name}**: ${t.columns?.length || 0} columns`).join('\n');
      return `Here are the available tables in your ${connection?.name || 'database'}:\n\n${tableList || '- No tables found'}\n\nYou can query any of these tables or ask me to help you build specific queries!`;
    }
    if (lowerQuestion.includes('join')) {
      return `Here's a basic join query template for your database:\n\n\`\`\`sql\nSELECT \n    c.NAME as customer_name,\n    o.AMOUNT as order_amount,\n    o.ORDER_DATE\nFROM CUSTOMERS c\nINNER JOIN ORDERS o ON c.ID = o.CUSTOMER_ID\nWHERE o.ORDER_DATE >= CURRENT_DATE - INTERVAL '30 days'\nORDER BY o.ORDER_DATE DESC;\n\`\`\`\n\nThis joins customers and orders tables, showing recent orders. You can modify the WHERE clause and SELECT fields based on your specific needs.`;
    }
    if (lowerQuestion.includes('last') && lowerQuestion.includes('days')) {
      return `To find records from the last 30 days, you can use:\n\n\`\`\`sql\nSELECT *\nFROM ORDERS\nWHERE ORDER_DATE >= CURRENT_DATE - INTERVAL '30 days'\nORDER BY ORDER_DATE DESC;\n\`\`\`\n\nThis will show all orders from the past 30 days. You can adjust the interval or add additional filters as needed.`;
    }
    return `I understand you're asking about "${question}". Based on your ${connection?.name || 'database'} connection, I can help you:\n\n- Generate SQL queries for your specific needs\n- Explain your database schema and relationships\n- Suggest optimizations for better performance\n- Help with data analysis and reporting queries\n\nCould you be more specific about what you'd like to accomplish?`;
  };

  const handleSendMessage = async (content: string) => {
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      connectionId: activeConnection || undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1200));
    const aiResponse = generateAIResponse(content, currentConnection);
    const assistantMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant' as const,
      content: aiResponse,
      timestamp: new Date().toISOString(),
      connectionId: activeConnection || undefined
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatPanelCollapsed', chatPanelCollapsed ? 'true' : 'false');
    }
  }, [chatPanelCollapsed]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      


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
            <div className="flex-shrink-0 p-1 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2" style={{ transform: chatPanelCollapsed ? 'translateX(0)' : `translateX(-${chatPanelSizePct / 2}%)` }}>
                <div className="relative max-w-sm w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setChatPanelCollapsed(!chatPanelCollapsed)}
                  title={chatPanelCollapsed ? 'Open chat' : 'Close chat'}
                  aria-label={chatPanelCollapsed ? 'Open chat' : 'Close chat'}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
            <PanelGroup direction="horizontal" className="flex-1">
              <Panel defaultSize={70} minSize={50}>
                <div className="h-full flex flex-col">
                  <SQLEditorTabs
                    tabContextMenus={tabContextMenus}
                    setTabContextMenus={setTabContextMenus}
                    onNewTab={handleNewTab}
                    onCloseTab={handleCloseTab}
                    onTabContextMenu={handleTabContextMenu}
                    onDeleteWorksheet={handleDeleteWorksheet}
                    onDuplicateTab={handleDuplicateTab}
                  />
                  <PanelGroup direction="vertical" className="flex-1">
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
                    {!bottomPanelCollapsed && (
                      <PanelResizeHandle className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors duration-200" />
                    )}
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
                </div>
              </Panel>
              {!chatPanelCollapsed && (
                <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700" />
              )}
              {!chatPanelCollapsed && (
                <Panel defaultSize={30} minSize={25} maxSize={40} onResize={(size) => setChatPanelSizePct(size)}>
                  <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Chat</span>
                      <button
                        onClick={() => setChatPanelCollapsed(true)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        aria-label="Close chat"
                        title="Close chat"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <ChatInterface
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      isTyping={isTyping}
                      currentConnection={currentConnection}
                    />
                  </div>
                </Panel>
              )}
            </PanelGroup>

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
                <div className="ml-2 flex items-center gap-2">
                  <button
                    title={schemaSidebarOpen ? 'Hide side panel' : 'Show side panel'}
                    onClick={() => setSchemaSidebarOpen(!schemaSidebarOpen)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                  <button
                    title={bottomPanelCollapsed ? 'Show bottom panel' : 'Hide bottom panel'}
                    onClick={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <PanelBottomOpen className="w-4 h-4" />
                  </button>
                  <button
                    title={chatPanelCollapsed ? 'Show chat panel' : 'Hide chat panel'}
                    onClick={() => setChatPanelCollapsed(!chatPanelCollapsed)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <PanelRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}