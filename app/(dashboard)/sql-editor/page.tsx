'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { mockConnections, mockQueryResults } from '@/lib/data';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Play,
  Save,
  Download,
  Upload,
  Settings,
  ChevronDown,
  Database,
  Clock,
  BarChart3,
  FileText,
  Plus,
  X,
  MoreHorizontal,
  Copy,
  Trash2
} from 'lucide-react';
import Editor from '@monaco-editor/react';

export default function SQLEditorPage() {
  const { 
    activeConnection, 
    setActiveConnection, 
    sqlEditorTabs, 
    activeSqlTab, 
    setActiveSqlTab, 
    addSqlTab, 
    removeSqlTab, 
    updateSqlTab,
    openTabs,
    deleteWorksheet
  } = useAppStore();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [showContextDropdowns, setShowContextDropdowns] = useState({
    role: false,
    warehouse: false,
    database: false,
    schema: false
  });
  const [snowflakeContext, setSnowflakeContext] = useState({
    role: 'ACCOUNTADMIN',
    warehouse: 'COMPUTE_WH',
    database: 'SALES',
    schema: 'PUBLIC'
  });
  const [tabContextMenus, setTabContextMenus] = useState<{ [key: string]: boolean }>({});
  const editorRef = useRef<any>(null);

  // Bottom panel state
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<'results' | 'history'>('results');

  const currentConnection = mockConnections.find(conn => conn.id === activeConnection);
  const activeTab = sqlEditorTabs.find(tab => tab.id === activeSqlTab);
  const openTabsList = sqlEditorTabs.filter(tab => openTabs.includes(tab.id));

  const handleExecuteQuery = async () => {
    if (!activeTab?.content.trim()) return;
    
    setIsExecuting(true);
    const startTime = Date.now();
    
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const endTime = Date.now();
    const execTime = (endTime - startTime) / 1000;
    
    // Mock results based on query content
    const results = mockQueryResults['select * from customers limit 5'] || {
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

  const toggleContextDropdown = (type: keyof typeof showContextDropdowns) => {
    setShowContextDropdowns(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const updateSnowflakeContext = (type: keyof typeof snowflakeContext, value: string) => {
    setSnowflakeContext(prev => ({
      ...prev,
      [type]: value
    }));
    setShowContextDropdowns(prev => ({
      ...prev,
      [type]: false
    }));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close dropdowns if clicking on dropdown buttons or their children
      if (target.closest('[data-dropdown-button]')) {
        return;
      }
      
      // Don't close dropdowns if clicking inside dropdown menus
      if (target.closest('[data-dropdown-menu]')) {
        return;
      }
      
      // Close all dropdowns
      setShowConnectionDropdown(false);
      setShowContextDropdowns({
        role: false,
        warehouse: false,
        database: false,
        schema: false
      });
      setTabContextMenus({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="navbar-area flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Connection Selector */}
            <div className="relative">
              <button
                data-dropdown-button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConnectionDropdown(!showConnectionDropdown);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Database className="w-3 h-3" />
                <span className="font-medium">
                  {currentConnection?.name || 'Select Connection'}
                </span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showConnectionDropdown && (
                <div data-dropdown-menu className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    {mockConnections.map((connection) => (
                      <button
                        key={connection.id}
                        onClick={() => {
                          setActiveConnection(connection.id);
                          setShowConnectionDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          activeConnection === connection.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          connection.status === 'connected' ? 'bg-green-500' :
                          connection.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {connection.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {connection.type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteQuery}
              disabled={isExecuting || !activeTab?.content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isExecuting ? 'Executing...' : 'Run'}
            </button>
            
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Save className="w-4 h-4" />
            </button>
            
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Snowflake Context Selectors */}
        {currentConnection?.type === 'snowflake' && (
          <div className="flex items-center gap-3 mt-3">
            {/* Role Selector */}
            <div className="relative">
              <button
                data-dropdown-button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleContextDropdown('role');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{snowflakeContext.role}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showContextDropdowns.role && (
                <div data-dropdown-menu className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-20">
                  <div className="p-1">
                    {currentConnection.snowflakeContext?.roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => updateSnowflakeContext('role', role)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          snowflakeContext.role === role ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Warehouse Selector */}
            <div className="relative">
              <button
                data-dropdown-button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleContextDropdown('warehouse');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">Warehouse:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{snowflakeContext.warehouse}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showContextDropdowns.warehouse && (
                <div data-dropdown-menu className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-20">
                  <div className="p-1">
                    {currentConnection.snowflakeContext?.warehouses.map((warehouse) => (
                      <button
                        key={warehouse}
                        onClick={() => updateSnowflakeContext('warehouse', warehouse)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          snowflakeContext.warehouse === warehouse ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {warehouse}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database and Schema Selectors - Show for all connection types */}
        {currentConnection && (
          <div className="flex items-center gap-3 mt-3">

            {/* Database Selector */}
            <div className="relative">
              <button
                data-dropdown-button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleContextDropdown('database');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">Database:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{currentConnection.type === 'snowflake' ? snowflakeContext.database : currentConnection.database}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showContextDropdowns.database && (
                <div data-dropdown-menu className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-20">
                  <div className="p-1">
                    {currentConnection?.schema.databases.map((database) => (
                      <button
                        key={database}
                        onClick={() => updateSnowflakeContext('database', database)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          (currentConnection.type === 'snowflake' ? snowflakeContext.database : currentConnection.database) === database ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {database}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Schema Selector */}
            <div className="relative">
              <button
                data-dropdown-button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleContextDropdown('schema');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">Schema:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{currentConnection.type === 'snowflake' ? snowflakeContext.schema : 'public'}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {showContextDropdowns.schema && (
                <div data-dropdown-menu className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-20">
                  <div className="p-1">
                    {(currentConnection.type === 'snowflake' ? ['PUBLIC', 'INFORMATION_SCHEMA', 'ANALYTICS'] : ['public', 'information_schema']).map((schema) => (
                      <button
                        key={schema}
                        onClick={() => updateSnowflakeContext('schema', schema)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          (currentConnection.type === 'snowflake' ? snowflakeContext.schema : 'public') === schema ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {schema}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      {openTabsList.length > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex items-center overflow-x-auto">
              {openTabsList.map((tab) => (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => setActiveSqlTab(tab.id)}
                    onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeSqlTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{tab.name}</span>
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </button>

                  {/* Tab Context Menu */}
                  {tabContextMenus[tab.id] && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20">
                      <div className="p-1">
                        <button
                          onClick={() => handleDuplicateTab(tab.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDeleteWorksheet(tab.id)}
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
            
            <button
              onClick={handleNewTab}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {openTabsList.length === 0 ? (
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
                  <div className="h-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col">
                    {/* Panel Header with Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                      <div className="flex">
                        <button
                          onClick={() => setActiveBottomTab('results')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeBottomTab === 'results'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Query Results
                            {queryResults && (
                              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                                {queryResults.rowCount}
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => setActiveBottomTab('history')}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeBottomTab === 'history'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Query History
                          </div>
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 px-4">
                        {activeBottomTab === 'results' && queryResults && (
                          <>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" />
                                <span>{queryResults.rowCount} rows</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{executionTime?.toFixed(2)}s</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => setBottomPanelCollapsed(true)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Panel Content */}
                    <div className="flex-1 overflow-hidden">
                      {activeBottomTab === 'results' ? (
                        queryResults ? (
                          <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-auto">
                              <table className="w-full min-w-max">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 whitespace-nowrap w-16 bg-gray-50 dark:bg-gray-700 sticky left-0 z-20">
                                      #
                                    </th>
                                    {queryResults.columns.map((column: string, index: number) => (
                                      <th
                                        key={index}
                                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 whitespace-nowrap min-w-[120px]"
                                      >
                                        {column}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                  {queryResults.rows.map((row: any, rowIndex: number) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap w-16 bg-white dark:bg-gray-800 sticky left-0 z-20 font-mono">
                                        {rowIndex + 1}
                                      </td>
                                      {queryResults.columns.map((column: string, colIndex: number) => (
                                        <td
                                          key={colIndex}
                                          className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap min-w-[120px]"
                                        >
                                          {row[column]}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <div className="text-center">
                              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>No query results yet</p>
                              <p className="text-sm">Run a query to see results here</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="h-full overflow-auto p-4">
                          <div className="space-y-3">
                            {/* Mock query history */}
                            {[
                              { query: 'SELECT * FROM customers LIMIT 10;', time: '2 minutes ago', status: 'success' },
                              { query: 'SELECT COUNT(*) FROM orders WHERE status = "completed";', time: '5 minutes ago', status: 'success' },
                              { query: 'SELECT * FROM invalid_table;', time: '10 minutes ago', status: 'error' }
                            ].map((item, index) => (
                              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <code className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                      {item.query}
                                    </code>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.time}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        item.status === 'success' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </div>
                                  </div>
                                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              )}
            </PanelGroup>

            {/* Collapsed Panel Indicator */}
            {bottomPanelCollapsed && (
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setBottomPanelCollapsed(false)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Show Results & History</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}