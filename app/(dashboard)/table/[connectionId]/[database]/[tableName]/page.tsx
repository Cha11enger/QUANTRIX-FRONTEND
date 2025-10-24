'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockConnections } from '@/lib/data';
import { ArrowLeft, Download, Filter, Search, RefreshCw, ChevronLeft, ChevronRight, MoveVertical as MoreVertical, Copy, Database, Table as TableIcon, Columns2 as Columns, ChartBar as BarChart3 } from 'lucide-react';

// Generate mock data with 15+ columns and 20+ rows
const generateMockTableData = (tableName: string) => {
  const columns = [
    'id', 'customer_id', 'first_name', 'last_name', 'email', 'phone', 
    'address', 'city', 'state', 'zip_code', 'country', 'created_at', 
    'updated_at', 'status', 'subscription_type', 'last_login', 'total_orders',
    'total_spent', 'preferred_language', 'marketing_consent'
  ];

  const statuses = ['active', 'inactive', 'pending', 'suspended'];
  const subscriptionTypes = ['free', 'basic', 'premium', 'enterprise'];
  const countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia'];
  const languages = ['en', 'es', 'fr', 'de', 'it'];

  const rows = Array.from({ length: 25 }, (_, index) => ({
    id: `${1000 + index}`,
    customer_id: `CUST_${String(index + 1).padStart(4, '0')}`,
    first_name: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'][index % 8],
    last_name: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][index % 8],
    email: `user${index + 1}@example.com`,
    phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    address: `${100 + index} Main Street`,
    city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'][index % 6],
    state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'][index % 6],
    zip_code: String(10000 + index * 100),
    country: countries[index % countries.length],
    created_at: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    updated_at: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    status: statuses[index % statuses.length],
    subscription_type: subscriptionTypes[index % subscriptionTypes.length],
    last_login: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    total_orders: Math.floor(Math.random() * 100),
    total_spent: (Math.random() * 5000).toFixed(2),
    preferred_language: languages[index % languages.length],
    marketing_consent: Math.random() > 0.5 ? 'true' : 'false'
  }));

  return { columns, rows };
};

export default function TableDataPage() {
  const params = useParams();
  const router = useRouter();
  const { connectionId, database, tableName } = params;
  
  const [tableData, setTableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const connection = mockConnections.find(conn => conn.id === connectionId);
  const table = connection?.schema.tables.find(t => t.name === tableName && t.database === database);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateMockTableData(tableName as string);
      setTableData(data);
      setLoading(false);
    };

    loadData();
  }, [tableName]);

  const filteredRows = tableData?.rows.filter((row: any) =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  const handleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedRows.map((row: any) => row.id)));
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading table data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Database className="w-4 h-4" />
                <span>{connection?.name}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{database}</span>
                <ChevronRight className="w-3 h-3" />
                <TableIcon className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tableName}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>{filteredRows.length} rows</span>
          </div>
          <div className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            <span>{tableData?.columns.length} columns</span>
          </div>
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span>{selectedRows.size} selected</span>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search table data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 sticky left-0 z-20">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedRows.length && paginatedRows.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {tableData?.columns.map((column: string, index: number) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 whitespace-nowrap min-w-[120px]"
                  >
                    {column.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {paginatedRows.map((row: any, rowIndex: number) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 sticky left-0 z-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {tableData?.columns.map((column: string, colIndex: number) => (
                    <td
                      key={colIndex}
                      className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap min-w-[120px]"
                    >
                      {column === 'email' ? (
                        <a
                          href={`mailto:${row[column]}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {row[column]}
                        </a>
                      ) : column === 'status' ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            row[column] === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : row[column] === 'inactive'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              : row[column] === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {row[column]}
                        </span>
                      ) : column === 'subscription_type' ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            row[column] === 'enterprise'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : row[column] === 'premium'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : row[column] === 'basic'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {row[column]}
                        </span>
                      ) : column === 'total_spent' ? (
                        <span className="font-mono">${row[column]}</span>
                      ) : column.includes('_at') || column.includes('login') ? (
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(row[column]).toLocaleDateString()}
                        </span>
                      ) : (
                        row[column]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredRows.length)} of{' '}
            {filteredRows.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}