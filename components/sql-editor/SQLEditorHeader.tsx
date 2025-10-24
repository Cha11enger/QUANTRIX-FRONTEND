'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { mockConnections } from '@/lib/data';
import {
  Play,
  Save,
  Settings,
  Database,
  ChevronDown
} from 'lucide-react';

interface SQLEditorHeaderProps {
  onExecuteQuery: () => void;
  isExecuting: boolean;
  activeTab: any;
}

export function SQLEditorHeader({ onExecuteQuery, isExecuting, activeTab }: SQLEditorHeaderProps) {
  const { activeConnection, setActiveConnection } = useAppStore();
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

  const currentConnection = mockConnections.find(conn => conn.id === activeConnection);

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
      
      if (target.closest('[data-dropdown-button]')) {
        return;
      }
      
      if (target.closest('[data-dropdown-menu]')) {
        return;
      }
      
      setShowConnectionDropdown(false);
      setShowContextDropdowns({
        role: false,
        warehouse: false,
        database: false,
        schema: false
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
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
            onClick={onExecuteQuery}
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

      {/* Database and Schema Selectors */}
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
  );
}