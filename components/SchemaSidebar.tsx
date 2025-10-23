'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { mockConnections, databaseIcons } from '@/lib/data';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Database,
  Table,
  Columns,
  RefreshCw,
  FileText,
  Calendar,
  Plus,
  Check,
  FolderOpen,
  GitBranch,
  MoreVertical,
  Copy,
  FolderPlus,
  Trash2
} from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  type: 'connection' | 'database' | 'table' | 'column';
  children?: TreeNode[];
  expanded?: boolean;
  connectionId?: string;
  meta?: any;
}

export function SchemaSidebar() {
  const pathname = usePathname();
  const { activeConnection, setActiveConnection, setSchemaSidebarOpen, sqlEditorTabs, updateSqlTab, activeSqlTab, addSqlTab, setActiveSqlTab, openTabs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'databases' | 'worksheets'>('databases');

  // Workspace dropdown state
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('My Workspace');
  const [workspaces, setWorkspaces] = useState([
    { id: 'my-workspace', name: 'My Workspace', isDefault: true },
    { id: 'shared-workspace', name: 'Shared Workspace', isDefault: false },
    { id: 'dev-workspace', name: 'Development', isDefault: false }
  ]);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Add new item states
  const [showAddNewDropdown, setShowAddNewDropdown] = useState(false);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const addNewDropdownRef = useRef<HTMLDivElement>(null);
  
  // SQL File creation states
  const [isCreatingSqlFile, setIsCreatingSqlFile] = useState(false);
  const [newSqlFileName, setNewSqlFileName] = useState('Untitled.sql');
  const sqlFileInputRef = useRef<HTMLInputElement>(null);
  
  // Regular File creation states
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('Untitled');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder creation states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('Untitled folder');
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Context menu states
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  // Folders state
  const [folders, setFolders] = useState<Array<{
    id: string;
    name: string;
    createdAt: string;
    items?: string[]; // Array of worksheet IDs in this folder
  }>>([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
      if (addNewDropdownRef.current && !addNewDropdownRef.current.contains(event.target as Node)) {
        setShowAddNewDropdown(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock worksheets data
  // Use actual SQL tabs as worksheets
  const worksheets = sqlEditorTabs.map(tab => ({
    id: tab.id,
    name: tab.name,
    query: tab.content,
    createdAt: new Date().toISOString() // You might want to add actual creation time to the tab structure
  }));

  const treeData = useMemo(() => {
    const buildTree = (): TreeNode[] => {
      return mockConnections.map(conn => {
        const connectionNode: TreeNode = {
          id: conn.id,
          name: conn.name,
          type: 'connection',
          connectionId: conn.id,
          meta: { status: conn.status, type: conn.type },
          children: conn.schema.databases.map(db => ({
            id: `${conn.id}-${db}`,
            name: db,
            type: 'database',
            connectionId: conn.id,
            children: conn.schema.tables
              .filter(table => table.database === db)
              .map(table => ({
                id: `${conn.id}-${db}-${table.name}`,
                name: table.name,
                type: 'table',
                connectionId: conn.id,
                children: table.columns.map(col => ({
                  id: `${conn.id}-${db}-${table.name}-${col.name}`,
                  name: col.name,
                  type: 'column',
                  connectionId: conn.id,
                  meta: { type: col.type, nullable: col.nullable }
                }))
              }))
          }))
        };
        return connectionNode;
      });
    };

    const filterTree = (nodes: TreeNode[], term: string): TreeNode[] => {
      if (!term) return nodes;
      
      return nodes.reduce<TreeNode[]>((acc, node) => {
        const matchesSearch = node.name.toLowerCase().includes(term.toLowerCase());
        const filteredChildren = node.children ? filterTree(node.children, term) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        
        return acc;
      }, []);
    };

    const tree = buildTree();
    return searchTerm ? filterTree(tree, searchTerm) : tree;
  }, [searchTerm]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      const newWorkspace = {
        id: `workspace-${Date.now()}`,
        name: newWorkspaceName.trim(),
        isDefault: false
      };
      setWorkspaces(prev => [...prev, newWorkspace]);
      setCurrentWorkspace(newWorkspace.name);
      setNewWorkspaceName('');
      setShowNewWorkspaceModal(false);
      setShowWorkspaceDropdown(false);
    }
  };

  const handleCancelCreateWorkspace = () => {
    setShowNewWorkspaceModal(false);
    setNewWorkspaceName('');
    setIsCreatingWorkspace(false);
  };

  const handleSqlFileKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSqlFileName.trim()) {
      setIsCreatingItem(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create new SQL tab using the store function
        addSqlTab({
          id: `sql-${Date.now()}`, // Generate unique ID for new SQL files
          name: newSqlFileName.trim(),
          content: `-- ${newSqlFileName.trim()}\n-- Enter your SQL query here\n\nSELECT * FROM your_table;`,
          connectionId: activeConnection || undefined
        });
        
        // Reset states
        setIsCreatingSqlFile(false);
        setNewSqlFileName('Untitled.sql');
        
      } catch (error) {
        console.error('Failed to create SQL file:', error);
      } finally {
        setIsCreatingItem(false);
      }
    } else if (e.key === 'Escape') {
      handleCancelSqlFileCreation();
    }
  };

  const handleCancelSqlFileCreation = () => {
    setIsCreatingSqlFile(false);
    setNewSqlFileName('Untitled.sql');
    setIsCreatingItem(false);
  };
  
  const handleFileKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFileName.trim()) {
      setIsCreatingItem(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create new tab using the store function
        addSqlTab({
          id: `file-${Date.now()}`, // Generate unique ID for new files
          name: newFileName.trim(),
          content: `-- ${newFileName.trim()}\n-- Enter your content here\n\n`,
          connectionId: activeConnection || undefined
        });
        
        // Reset states
        setIsCreatingFile(false);
        setNewFileName('Untitled');
        
      } catch (error) {
        console.error('Failed to create file:', error);
      } finally {
        setIsCreatingItem(false);
      }
    } else if (e.key === 'Escape') {
      handleCancelFileCreation();
    }
  };

  const handleCancelFileCreation = () => {
    setIsCreatingFile(false);
    setNewFileName('Untitled');
    setIsCreatingItem(false);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, itemId: string, itemType: 'worksheet' | 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(`${itemType}-${itemId}`);
  };

  const handleDuplicate = (itemId: string) => {
    const worksheet = worksheets.find(w => w.id === itemId);
    if (worksheet) {
      addSqlTab({
        id: `${itemId}-copy-${Date.now()}`, // Generate unique ID for duplicated worksheets
        name: `${worksheet.name} (Copy)`,
        content: worksheet.query,
        connectionId: activeConnection || undefined
      });
    }
    setShowContextMenu(null);
  };

  const handleMoveToFolder = (itemId: string, folderId: string) => {
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          items: [...(folder.items || []), itemId]
        };
      }
      // Remove from other folders
      return {
        ...folder,
        items: (folder.items || []).filter(id => id !== itemId)
      };
    }));
    setShowContextMenu(null);
  };

  const handleDelete = (itemId: string, itemType: 'worksheet' | 'folder') => {
    if (itemType === 'worksheet') {
      // Permanently delete worksheet (remove from both tabs and worksheets)
      deleteWorksheet(itemId);
      // Remove from folders
      setFolders(prev => prev.map(folder => ({
        ...folder,
        items: (folder.items || []).filter(id => id !== itemId)
      })));
    } else {
      // Delete folder
      setFolders(prev => prev.filter(folder => folder.id !== itemId));
    }
    setShowContextMenu(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedItem) {
      handleMoveToFolder(draggedItem, folderId);
      setDraggedItem(null);
      setDragOverFolder(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverFolder(null);
  };
  const handleFolderKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFolderName.trim()) {
      setIsCreatingItem(true);
      
      try {
        // Simulate API call for folder creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create new folder and add to folders state
        const newFolder = {
          id: `folder-${Date.now()}`,
          name: newFolderName.trim(),
          createdAt: new Date().toISOString(),
          items: []
        };
        
        setFolders(prev => [...prev, newFolder]);
        
        // Reset states
        setIsCreatingFolder(false);
        setNewFolderName('Untitled folder');
        
      } catch (error) {
        console.error('Failed to create folder:', error);
      } finally {
        setIsCreatingItem(false);
      }
    } else if (e.key === 'Escape') {
      handleCancelFolderCreation();
    }
  };

  const handleCancelFolderCreation = () => {
    setIsCreatingFolder(false);
    setNewFolderName('Untitled folder');
    setIsCreatingItem(false);
  };
  const handleCreateItem = async (itemType: string) => {
    if (itemType === 'SQL File') {
      // Show inline input for SQL file creation
      setIsCreatingSqlFile(true);
      setNewSqlFileName('Untitled.sql');
      setShowAddNewDropdown(false);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        sqlFileInputRef.current?.focus();
        // Select only the filename part without the extension
        if (sqlFileInputRef.current) {
          const filename = newSqlFileName;
          const dotIndex = filename.lastIndexOf('.');
          if (dotIndex > 0) {
            sqlFileInputRef.current.setSelectionRange(0, dotIndex);
          } else {
            sqlFileInputRef.current.select();
          }
        }
      }, 100);
      return;
    }
    
    if (itemType === 'File') {
      // Show inline input for regular file creation
      setIsCreatingFile(true);
      setNewFileName('Untitled');
      setShowAddNewDropdown(false);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        fileInputRef.current?.focus();
        fileInputRef.current?.select();
      }, 100);
      return;
    }
    
    if (itemType === 'Folder') {
      // Show inline input for folder creation
      setIsCreatingFolder(true);
      setNewFolderName('Untitled folder');
      setShowAddNewDropdown(false);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        folderInputRef.current?.focus();
        // Select the entire folder name including "folder"
        folderInputRef.current?.select();
      }, 100);
      return;
    }
    
    setIsCreatingItem(true);
    setShowAddNewDropdown(false);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new item based on type
      const newItem = {
        id: `${itemType.toLowerCase().replace(' ', '-')}-${Date.now()}`,
        name: `New ${itemType}`,
        type: itemType.toLowerCase(),
        createdAt: new Date().toISOString()
      };
      
      console.log(`Created new ${itemType}:`, newItem);
      
      // You can add the item to your worksheets or files list here
      // For now, we'll just log it
      
    } catch (error) {
      console.error(`Failed to create ${itemType}:`, error);
    } finally {
      setIsCreatingItem(false);
    }
  };

  const renderNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isActive = node.type === 'connection' && activeConnection === node.id;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'connection':
          return databaseIcons[node.meta?.type as keyof typeof databaseIcons] || '💾';
        case 'database':
          return <Database className="w-4 h-4" />;
        case 'table':
          return <Table className="w-4 h-4" />;
        case 'column':
          return <Columns className="w-4 h-4" />;
        default:
          return null;
      }
    };

    const getNodeColor = () => {
      if (node.type === 'connection') {
        switch (node.meta?.status) {
          case 'connected':
            return 'text-green-600 dark:text-green-400';
          case 'error':
            return 'text-red-600 dark:text-red-400';
          default:
            return 'text-gray-600 dark:text-gray-400';
        }
      }
      return 'text-gray-600 dark:text-gray-300';
    };

    return (
      <div key={node.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all duration-150
            ${isActive ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            if (node.type === 'connection') {
              setActiveConnection(node.connectionId || null);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          <div className={`flex items-center gap-1 ${getNodeColor()}`}>
            {getNodeIcon()}
          </div>
          
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {node.name}
          </span>
          
          {node.type === 'column' && node.meta && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {node.meta.type}
              {node.meta.nullable && '?'}
            </span>
          )}
          
          {node.type === 'connection' && (
            <div className={`
              w-2 h-2 rounded-full ml-auto
              ${node.meta?.status === 'connected' ? 'bg-green-500' : 
                node.meta?.status === 'error' ? 'bg-red-500' : 'bg-gray-500'}
            `} />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderFolderItem = (folder: any) => {
    const isDropTarget = dragOverFolder === folder.id;
    const folderItems = worksheets.filter(w => folder.items?.includes(w.id));
    
    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-all duration-150 group ${
            isDropTarget 
              ? 'bg-blue-100 dark:bg-blue-900 border-2 border-dashed border-blue-400' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          onContextMenu={(e) => handleContextMenu(e, folder.id, 'folder')}
        >
          <FolderOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {folder.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Folder • {folderItems.length} items
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => handleContextMenu(e, folder.id, 'folder')}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <MoreVertical className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Folder contents */}
        {folderItems.length > 0 && (
          <div className="ml-6 mt-1 space-y-1">
            {folderItems.map(item => renderWorksheetItem(item, true))}
          </div>
        )}
      </div>
    );
  };
  const renderWorksheetItem = (worksheet: any, isInFolder = false) => {
    const isDragging = draggedItem === worksheet.id;
    const isOpen = openTabs.includes(worksheet.id);
    const isActive = activeSqlTab === worksheet.id && isOpen;
    
    return (
      <div
        key={worksheet.id}
        className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer transition-all duration-150 group ${
          isDragging 
            ? 'opacity-50' 
            : isActive
            ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700'
            : isOpen
            ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        } ${isInFolder ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
        draggable={!isInFolder}
        onDragStart={(e) => handleDragStart(e, worksheet.id)}
        onDragEnd={handleDragEnd}
        onClick={() => {
          // Check if this worksheet is already open
          if (openTabs.includes(worksheet.id)) {
            // Tab is already open, just switch to it
            setActiveSqlTab(worksheet.id);
          } else {
            // Tab is not open, open it and switch to it
            setActiveSqlTab(worksheet.id);
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, worksheet.id, 'worksheet')}
      >
        <FileText className={`w-4 h-4 flex-shrink-0 ${
          isActive 
            ? 'text-blue-600 dark:text-blue-400' 
            : isOpen
            ? 'text-gray-700 dark:text-gray-300'
            : 'text-gray-500 dark:text-gray-400'
        }`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${
            isActive 
              ? 'text-blue-900 dark:text-blue-100' 
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {worksheet.name}
          </div>
          <div className={`text-xs truncate ${
            isActive 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {worksheet.query.substring(0, 50)}...
          </div>
        </div>
        {isOpen && (
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isActive ? 'bg-blue-500' : 'bg-gray-400'
          }`} />
        )}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, worksheet.id, 'worksheet');
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            <MoreVertical className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Workspace Dropdown */}
        <div className="relative mb-3" ref={dropdownRef}>
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-300 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentWorkspace}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
              showWorkspaceDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Workspace Dropdown Menu */}
          {showWorkspaceDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 py-1">
              {/* Search */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-7 pr-3 py-1 text-xs bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Workspaces Section */}
              <div className="py-1">
                <div className="px-3 py-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workspaces
                  </span>
                </div>
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      setCurrentWorkspace(workspace.name);
                      setShowWorkspaceDropdown(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {workspace.name}
                      </span>
                    </div>
                    {currentWorkspace === workspace.name && (
                      <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Create Workspace Section */}
              <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                <div className="px-3 py-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Create Workspace
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setShowNewWorkspaceModal(true);
                    setShowWorkspaceDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Plus className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">New</span>
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <GitBranch className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">From Git repository</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {pathname === '/sql-editor' ? 'Workspace' : 'Schema'}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {/* Refresh schema */}}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Refresh schema"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Tab Switch for SQL Editor */}
        {pathname === '/sql-editor' && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-0.5 mb-3 min-w-0">
            <button
              onClick={() => setActiveTab('databases')}
              className={`flex-1 flex items-center justify-center gap-1 px-1 py-1 rounded text-xs font-medium transition-colors min-w-0 ${
                activeTab === 'databases'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-3 h-3" />
              <span className="truncate">Databases</span>
            </button>
            <button
              onClick={() => setActiveTab('worksheets')}
              className={`flex-1 flex items-center justify-center gap-1 px-1 py-1 rounded text-xs font-medium transition-colors min-w-0 ${
                activeTab === 'worksheets'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span className="truncate">Worksheets</span>
            </button>
          </div>
        )}
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'worksheets' ? "Search worksheets..." : "Search schema..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Add New Button - Only show in worksheets tab */}
        {pathname === '/sql-editor' && activeTab === 'worksheets' && (
          <div className="relative mt-3" ref={addNewDropdownRef}>
            <button
              onClick={() => setShowAddNewDropdown(!showAddNewDropdown)}
              disabled={isCreatingItem}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingItem ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add new</span>
                </>
              )}
            </button>
            
            {/* Add New Dropdown */}
            {showAddNewDropdown && !isCreatingItem && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 py-1">
                {[
                  { type: 'SQL File', icon: FileText },
                  { type: 'File', icon: FileText },
                  { type: 'Folder', icon: FolderOpen }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleCreateItem(item.type)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{item.type}</span>
                  </button>
                ))}
                
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                
                {[
                  { type: 'Upload Files', icon: Plus },
                  { type: 'Upload Folder', icon: Plus }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleCreateItem(item.type)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{item.type}</span>
                  </button>
                ))}
                
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                
                <button
                  onClick={() => handleCreateItem('dbt Project')}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">dbt Project</span>
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    PREVIEW
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {activeTab === 'databases' ? (
          treeData.map(node => renderNode(node))
        ) : (
          <div className="space-y-1">
            {/* Inline SQL File Creation */}
            {isCreatingSqlFile && (
              <div className="flex items-center gap-2 px-2 py-2 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <input
                  ref={sqlFileInputRef}
                  type="text"
                  value={newSqlFileName}
                  onChange={(e) => setNewSqlFileName(e.target.value)}
                  onKeyDown={handleSqlFileKeyPress}
                  onBlur={handleCancelSqlFileCreation}
                  className="flex-1 bg-transparent text-sm font-medium text-blue-900 dark:text-blue-100 focus:outline-none"
                  disabled={isCreatingItem}
                />
                {isCreatingItem && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                )}
              </div>
            )}
            
            {/* Inline File Creation */}
            {isCreatingFile && (
              <div className="flex items-center gap-2 px-2 py-2 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                <FileText className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <input
                  ref={fileInputRef}
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={handleFileKeyPress}
                  onBlur={handleCancelFileCreation}
                  className="flex-1 bg-transparent text-sm font-medium text-green-900 dark:text-green-100 focus:outline-none"
                  disabled={isCreatingItem}
                />
                {isCreatingItem && (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                )}
              </div>
            )}
            
            {/* Inline Folder Creation */}
            {isCreatingFolder && (
              <div className="flex items-center gap-2 px-2 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                <FolderOpen className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <input
                  ref={folderInputRef}
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={handleFolderKeyPress}
                  onBlur={handleCancelFolderCreation}
                  className="flex-1 bg-transparent text-sm font-medium text-yellow-900 dark:text-yellow-100 focus:outline-none"
                  disabled={isCreatingItem}
                />
                {isCreatingItem && (
                  <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                )}
              </div>
            )}
            
            {/* Display folders first */}
            {folders
              .filter(folder => 
                !searchTerm || 
                folder.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(folder => renderFolderItem(folder))
            }
            
            {/* Then display worksheets/files */}
            {worksheets
              .filter(worksheet => 
                // Only show worksheets that are not in any folder
                !folders.some(folder => (folder.items || []).includes(worksheet.id)) &&
                // Apply search filter
                (
                  !searchTerm || 
                  worksheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  worksheet.query.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map(worksheet => renderWorksheetItem(worksheet))
            }
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create workspace
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workspace name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCreatingWorkspace) {
                      handleCreateWorkspace();
                    }
                  }}
                  className="w-full px-3 py-2 border border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workspace name"
                  autoFocus
                  disabled={isCreatingWorkspace}
                />
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelCreateWorkspace}
                  disabled={isCreatingWorkspace}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={!newWorkspaceName.trim() || isCreatingWorkspace}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isCreatingWorkspace && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          {showContextMenu.startsWith('worksheet-') && (
            <>
              <button
                onClick={() => handleDuplicate(showContextMenu.replace('worksheet-', ''))}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
              >
                <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">Duplicate</span>
              </button>
              
              {folders.length > 0 && (
                <div className="relative group">
                  <div className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FolderPlus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">Move to folder</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </div>
                  
                  {/* Submenu */}
                  <div className="absolute left-full top-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto min-w-[140px] z-50">
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => handleMoveToFolder(showContextMenu.replace('worksheet-', ''), folder.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                      >
                        <FolderOpen className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-gray-900 dark:text-white truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
            </>
          )}
          
          <button
            onClick={() => {
              const itemId = showContextMenu.replace('worksheet-', '').replace('folder-', '');
              const itemType = showContextMenu.startsWith('worksheet-') ? 'worksheet' : 'folder';
              handleDelete(itemId, itemType);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}