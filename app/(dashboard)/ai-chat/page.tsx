'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { mockConnections, mockChatHistory } from '@/lib/data';
import {
  Send,
  Bot,
  User,
  Database,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Loader2,
  Copy,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { Sidebar } from 'lucide-react';

const suggestedQuestions = [
  "Show me the top 10 customers by order value",
  "What tables are available in my database?",
  "Find all orders from the last 30 days",
  "Show me database schema for the sales table",
  "Generate a query to join customers and orders"
];

export default function AIChatPage() {
  const { activeConnection, setActiveConnection, addChatMessage } = useAppStore();
  const { schemaSidebarOpen, setSchemaSidebarOpen } = useAppStore();
  const [messages, setMessages] = useState(mockChatHistory);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [toggleButtonTop, setToggleButtonTop] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarTogglePosition');
      return saved ? parseFloat(saved) : 50;
    }
    return 50;
  }); // Percentage from top
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentConnection = mockConnections.find(conn => conn.id === activeConnection);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      connectionId: activeConnection || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

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

  const generateAIResponse = (question: string, connection: any) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('top') && lowerQuestion.includes('customer')) {
      return `Based on your ${connection?.name || 'database'}, here's a query to get the top customers by order value:

\`\`\`sql
SELECT 
    c.NAME,
    c.EMAIL,
    SUM(o.AMOUNT) as total_value,
    COUNT(o.ID) as order_count
FROM CUSTOMERS c
JOIN ORDERS o ON c.ID = o.CUSTOMER_ID
WHERE o.STATUS = 'completed'
GROUP BY c.ID, c.NAME, c.EMAIL
ORDER BY total_value DESC
LIMIT 10;
\`\`\`

This query joins customers with their orders and calculates the total value for each customer, filtering for completed orders only.`;
    }
    
    if (lowerQuestion.includes('table') || lowerQuestion.includes('schema')) {
      const tables = connection?.schema?.tables || [];
      const tableList = tables.map(t => `- **${t.name}**: ${t.columns?.length || 0} columns`).join('\n');
      
      return `Here are the available tables in your ${connection?.name || 'database'}:

${tableList || '- No tables found'}

You can query any of these tables or ask me to help you build specific queries!`;
    }
    
    if (lowerQuestion.includes('join')) {
      return `Here's a basic join query template for your database:

\`\`\`sql
SELECT 
    c.NAME as customer_name,
    o.AMOUNT as order_amount,
    o.ORDER_DATE
FROM CUSTOMERS c
INNER JOIN ORDERS o ON c.ID = o.CUSTOMER_ID
WHERE o.ORDER_DATE >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY o.ORDER_DATE DESC;
\`\`\`

This joins customers and orders tables, showing recent orders. You can modify the WHERE clause and SELECT fields based on your specific needs.`;
    }
    
    if (lowerQuestion.includes('last') && lowerQuestion.includes('days')) {
      return `To find records from the last 30 days, you can use:

\`\`\`sql
SELECT *
FROM ORDERS
WHERE ORDER_DATE >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY ORDER_DATE DESC;
\`\`\`

This will show all orders from the past 30 days. You can adjust the interval or add additional filters as needed.`;
    }
    
    // Default response
    return `I understand you're asking about "${question}". Based on your ${connection?.name || 'database'} connection, I can help you:

- Generate SQL queries for your specific needs
- Explain your database schema and relationships  
- Suggest optimizations for better performance
- Help with data analysis and reporting queries

Could you be more specific about what you'd like to accomplish? For example:
- What specific data are you looking for?
- Which tables should I focus on?
- Are you looking for trends, summaries, or raw data?`;
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className={`max-w-2xl ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}>
            <div className="space-y-2">
              {message.content.split('\n').map((line: string, index: number) => {
                if (line.startsWith('```sql')) {
                  const codeBlock = message.content.split('```sql')[1]?.split('```')[0];
                  return (
                    <div key={index} className="relative">
                      <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-3 mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400">SQL</span>
                          <button
                            onClick={() => copyToClipboard(codeBlock?.trim() || '', message.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                          >
                            {copiedMessageId === message.id ? (
                              <CheckCheck className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-gray-100 overflow-x-auto">
                          <code>{codeBlock?.trim()}</code>
                        </pre>
                      </div>
                    </div>
                  );
                }
                return line && (
                  <p key={index} className={`text-sm ${isUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
          
          <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(message.timestamp)}
            </span>
            {!isUser && (
              <button
                onClick={() => copyToClipboard(message.content, message.id)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-300 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white dark:text-gray-800" />
          </div>
        )}
      </div>
    );
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const viewportHeight = window.innerHeight;
    const navbarHeight = 120; // Approximate navbar height
    const minTop = navbarHeight;
    const maxTop = viewportHeight - 100;
    
    const clampedY = Math.max(minTop, Math.min(maxTop, clientY));
    const percentage = ((clampedY - minTop) / (maxTop - minTop)) * 80 + 10; // 10% to 90% range
    
    const newPosition = percentage;
    setToggleButtonTop(newPosition);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarTogglePosition', newPosition.toString());
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    handleMouseMove(e);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);
  
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="navbar-area p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Database Assistant</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ask questions about your data and get SQL queries
              </p>
            </div>
          </div>
          
          {/* Connection Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
            <button
              onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentConnection?.name || 'Select Connection'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showConnectionDropdown && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
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
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ask me anything about your database schema, or request help with SQL queries.
            </p>
            
            <div className="max-w-2xl mx-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map(renderMessage)}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(newMessage);
                  }
                }}
                placeholder={currentConnection ? 
                  `Ask me about ${currentConnection.name}...` : 
                  'Select a connection to start chatting...'
                }
                disabled={isTyping || !currentConnection}
                className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <button
            onClick={() => handleSendMessage(newMessage)}
            disabled={!newMessage.trim() || isTyping || !currentConnection}
            className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {!currentConnection && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            Please select a database connection to start chatting
          </p>
        )}
      </div>
    </div>
  );
}