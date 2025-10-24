'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { mockConnections, mockChatHistory } from '@/lib/data';
import {
  Database,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { ChatInterface } from '@/components/ai-chat/ChatInterface';
import { SuggestedQuestions } from '@/components/ai-chat/SuggestedQuestions';

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
  const [isTyping, setIsTyping] = useState(false);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);

  const currentConnection = mockConnections.find(conn => conn.id === activeConnection);

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
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <SuggestedQuestions
            questions={suggestedQuestions}
            onQuestionClick={handleSuggestedQuestion}
          />
        </div>
      ) : null}
      
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isTyping={isTyping}
        currentConnection={currentConnection}
      />
    </div>
  );
}