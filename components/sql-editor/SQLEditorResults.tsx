'use client';

import { useState } from 'react';
import {
  BarChart3,
  Clock,
  Download,
  Copy,
  X
} from 'lucide-react';

interface SQLEditorResultsProps {
  queryResults: any;
  executionTime: number | null;
  bottomPanelCollapsed: boolean;
  setBottomPanelCollapsed: (collapsed: boolean) => void;
}

export function SQLEditorResults({
  queryResults,
  executionTime,
  bottomPanelCollapsed,
  setBottomPanelCollapsed
}: SQLEditorResultsProps) {
  const [activeBottomTab, setActiveBottomTab] = useState<'results' | 'history'>('results');

  if (bottomPanelCollapsed) {
    return (
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setBottomPanelCollapsed(false)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Show Results & History</span>
        </button>
      </div>
    );
  }

  return (
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
  );
}