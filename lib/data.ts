export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'snowflake' | 'mysql' | 'postgresql' | 'mongodb' | 'sqlserver';
  status: 'connected' | 'disconnected' | 'error';
  host?: string;
  database?: string;
  lastConnected: string;
  snowflakeContext?: {
    roles: string[];
    warehouses: string[];
    currentRole: string;
    currentWarehouse: string;
    currentDatabase: string;
    currentSchema: string;
  };
  schema: {
    databases: string[];
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
      }>;
      database: string;
    }>;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  connectionId?: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  executionTime: number;
  rowCount: number;
}

export const mockConnections: DatabaseConnection[] = [
  {
    id: '1',
    name: 'Sales Data Warehouse',
    type: 'snowflake',
    status: 'connected',
    host: 'company.snowflakecomputing.com',
    database: 'SALES_DB',
    lastConnected: '2024-01-15T14:30:00Z',
    snowflakeContext: {
      roles: ['ACCOUNTADMIN', 'SYSADMIN', 'USERADMIN', 'SECURITYADMIN', 'PUBLIC'],
      warehouses: ['COMPUTE_WH', 'ANALYTICS_WH', 'ETL_WH', 'REPORTING_WH'],
      currentRole: 'ACCOUNTADMIN',
      currentWarehouse: 'COMPUTE_WH',
      currentDatabase: 'SALES',
      currentSchema: 'PUBLIC'
    },
    schema: {
      databases: ['SALES', 'MARKETING', 'ANALYTICS'],
      tables: [
        {
          name: 'CUSTOMERS',
          database: 'SALES',
          columns: [
            { name: 'ID', type: 'VARCHAR(36)', nullable: false },
            { name: 'NAME', type: 'VARCHAR(255)', nullable: false },
            { name: 'EMAIL', type: 'VARCHAR(255)', nullable: false },
            { name: 'CREATED_AT', type: 'TIMESTAMP', nullable: false },
            { name: 'UPDATED_AT', type: 'TIMESTAMP', nullable: true }
          ]
        },
        {
          name: 'ORDERS',
          database: 'SALES',
          columns: [
            { name: 'ID', type: 'VARCHAR(36)', nullable: false },
            { name: 'CUSTOMER_ID', type: 'VARCHAR(36)', nullable: false },
            { name: 'AMOUNT', type: 'DECIMAL(10,2)', nullable: false },
            { name: 'STATUS', type: 'VARCHAR(50)', nullable: false },
            { name: 'ORDER_DATE', type: 'TIMESTAMP', nullable: false }
          ]
        },
        {
          name: 'CAMPAIGNS',
          database: 'MARKETING',
          columns: [
            { name: 'ID', type: 'VARCHAR(36)', nullable: false },
            { name: 'NAME', type: 'VARCHAR(255)', nullable: false },
            { name: 'BUDGET', type: 'DECIMAL(12,2)', nullable: false },
            { name: 'START_DATE', type: 'DATE', nullable: false },
            { name: 'END_DATE', type: 'DATE', nullable: true }
          ]
        }
      ]
    }
  },
  {
    id: '2',
    name: 'User Analytics DB',
    type: 'postgresql',
    status: 'connected',
    host: 'analytics-db.company.com',
    database: 'user_analytics',
    lastConnected: '2024-01-15T13:45:00Z',
    schema: {
      databases: ['public', 'events', 'reporting'],
      tables: [
        {
          name: 'users',
          database: 'public',
          columns: [
            { name: 'id', type: 'serial', nullable: false },
            { name: 'username', type: 'varchar(50)', nullable: false },
            { name: 'email', type: 'varchar(255)', nullable: false },
            { name: 'last_login', type: 'timestamp', nullable: true }
          ]
        },
        {
          name: 'page_views',
          database: 'events',
          columns: [
            { name: 'id', type: 'bigserial', nullable: false },
            { name: 'user_id', type: 'integer', nullable: false },
            { name: 'page_url', type: 'text', nullable: false },
            { name: 'timestamp', type: 'timestamp', nullable: false }
          ]
        }
      ]
    }
  },
  {
    id: '3',
    name: 'Product Catalog',
    type: 'mongodb',
    status: 'error',
    host: 'mongodb.company.com',
    database: 'products',
    lastConnected: '2024-01-14T09:20:00Z',
    schema: {
      databases: ['products', 'inventory'],
      tables: [
        {
          name: 'items',
          database: 'products',
          columns: [
            { name: '_id', type: 'ObjectId', nullable: false },
            { name: 'name', type: 'String', nullable: false },
            { name: 'price', type: 'Number', nullable: false },
            { name: 'category', type: 'String', nullable: false }
          ]
        }
      ]
    }
  }
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Show me the top 10 customers by order value',
    timestamp: '2024-01-15T10:30:00Z',
    connectionId: '1'
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Based on your Sales Data Warehouse, here\'s a query to get the top 10 customers by total order value:\n\n```sql\nSELECT \n    c.NAME,\n    c.EMAIL,\n    SUM(o.AMOUNT) as total_value,\n    COUNT(o.ID) as order_count\nFROM SALES.CUSTOMERS c\nJOIN SALES.ORDERS o ON c.ID = o.CUSTOMER_ID\nWHERE o.STATUS = \'completed\'\nGROUP BY c.ID, c.NAME, c.EMAIL\nORDER BY total_value DESC\nLIMIT 10;\n```\n\nThis query joins customers with their orders and calculates the total value for each customer.',
    timestamp: '2024-01-15T10:31:00Z',
    connectionId: '1'
  },
  {
    id: '3',
    role: 'user',
    content: 'What tables are available in the marketing database?',
    timestamp: '2024-01-15T11:15:00Z',
    connectionId: '1'
  },
  {
    id: '4',
    role: 'assistant',
    content: 'In the MARKETING database of your Sales Data Warehouse, you have the following tables:\n\n**CAMPAIGNS**\n- ID (VARCHAR(36)) - Primary key\n- NAME (VARCHAR(255)) - Campaign name\n- BUDGET (DECIMAL(12,2)) - Campaign budget\n- START_DATE (DATE) - Campaign start date\n- END_DATE (DATE) - Campaign end date (nullable)\n\nYou can use this table to analyze campaign performance and budget allocation.',
    timestamp: '2024-01-15T11:16:00Z',
    connectionId: '1'
  }
];

export const mockQueryResults: Record<string, QueryResult> = {
  'select * from customers limit 5': {
    columns: ['ID', 'NAME', 'EMAIL', 'CREATED_AT', 'UPDATED_AT'],
    rows: [
      {
        ID: 'cust_001',
        NAME: 'John Doe',
        EMAIL: 'john.doe@example.com',
        CREATED_AT: '2023-01-15 09:30:00',
        UPDATED_AT: '2024-01-10 14:22:00'
      },
      {
        ID: 'cust_002',
        NAME: 'Jane Smith',
        EMAIL: 'jane.smith@example.com',
        CREATED_AT: '2023-02-20 11:15:00',
        UPDATED_AT: '2024-01-08 16:45:00'
      },
      {
        ID: 'cust_003',
        NAME: 'Bob Johnson',
        EMAIL: 'bob.johnson@example.com',
        CREATED_AT: '2023-03-10 14:22:00',
        UPDATED_AT: '2023-12-25 10:30:00'
      },
      {
        ID: 'cust_004',
        NAME: 'Alice Brown',
        EMAIL: 'alice.brown@example.com',
        CREATED_AT: '2023-04-05 16:45:00',
        UPDATED_AT: '2024-01-12 09:15:00'
      },
      {
        ID: 'cust_005',
        NAME: 'Charlie Wilson',
        EMAIL: 'charlie.wilson@example.com',
        CREATED_AT: '2023-05-18 08:20:00',
        UPDATED_AT: '2024-01-05 13:40:00'
      }
    ],
    executionTime: 0.125,
    rowCount: 5
  }
};

export const mockDashboardStats = {
  totalConnections: 3,
  activeConnections: 2,
  totalQueries: 156,
  avgQueryTime: 0.245
};

export const mockRecentActivity = [
  {
    id: '1',
    type: 'connection',
    message: 'Connected to Sales Data Warehouse',
    timestamp: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    type: 'query',
    message: 'Executed query on User Analytics DB',
    timestamp: '2024-01-15T13:45:00Z'
  },
  {
    id: '3',
    type: 'error',
    message: 'Connection failed to Product Catalog',
    timestamp: '2024-01-15T12:20:00Z'
  },
  {
    id: '4',
    type: 'query',
    message: 'Created new saved query: "Top Customers"',
    timestamp: '2024-01-15T11:15:00Z'
  }
];

export const databaseIcons = {
  snowflake: '❄️',
  mysql: '🐬',
  postgresql: '🐘',
  mongodb: '🍃',
  sqlserver: '🏢'
};