'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { mockConnections, databaseIcons } from '@/lib/data';
import { ChevronDown, ChevronRight, Database, Table, Columns2 as Columns } from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  type: 'connection' | 'database' | 'table' | 'column';
  children?: TreeNode[];
  expanded?: boolean;
  connectionId?: string;
  meta?: any;
}

interface DatabaseTreeProps {
  searchTerm: string;
  activeConnection: string | null;
  setActiveConnection: (id: string | null) => void;
}

export function DatabaseTree({ searchTerm, activeConnection, setActiveConnection }: DatabaseTreeProps) {
  const router = useRouter();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

  const handleTableClick = (node: TreeNode) => {
    if (node.type === 'table' && node.connectionId) {
      const parts = node.id.split('-');
      const database = parts[1];
      const tableName = node.name;
      router.push(`/table/${node.connectionId}/${database}/${tableName}`);
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
            } else if (node.type === 'table') {
              handleTableClick(node);
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

  return (
    <div className="space-y-1">
      {treeData.map(node => renderNode(node))}
    </div>
  );
}