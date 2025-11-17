import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DatabaseConnection, ChatMessage } from './data';
import { debug } from './debug';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, userData?: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

interface AppState {
  activeConnection: string | null;
  currentRole: string;
  schemaSidebarOpen: boolean;
  schemaSidebarWidth: number;
  rolesRefreshTick: number;
  sqlEditorTabs: Array<{
    id: string;
    name: string;
    content: string;
    connectionId?: string;
  }>;
  openTabs: string[]; // Array of tab IDs that are currently open
  activeSqlTab: string;
  chatMessages: ChatMessage[];
  setActiveConnection: (id: string | null) => void;
  setCurrentRole: (role: string) => void;
  bumpRolesRefresh: () => void;
  setSchemaSidebarOpen: (open: boolean) => void;
  setSchemaSidebarWidth: (width: number) => void;
  addSqlTab: (tab: { id?: string; name: string; content?: string; connectionId?: string }) => void;
  removeSqlTab: (id: string) => void;
  deleteWorksheet: (id: string) => void;
  updateSqlTab: (id: string, content: string) => void;
  setActiveSqlTab: (id: string) => void;
  reorderSqlTabs: (sourceId: string, targetId: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string, userData?: any) => {
        debug.log('Login attempt', { email });
        
        try {
          // If userData is provided (from registration flow), use it directly
          if (userData) {
            const user = {
              id: userData.id || userData.userId || '1',
              name: userData.username || userData.name || email.split('@')[0],
              email: userData.email || email,
              avatar: userData.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'
            };
            set({ user, isAuthenticated: true });
            debug.log('Login successful with provided user data', { user });
            return true;
          }
          
          // Fallback to simulated login for existing functionality
          if (email && password) {
            const user = {
              id: '1',
              name: email.split('@')[0],
              email: email,
              avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'
            };
            set({ user, isAuthenticated: true });
            debug.log('Login successful (simulated)', { user });
            return true;
          }
          
          debug.log('Login failed', { email });
          return false;
        } catch (error) {
          debug.log('Login error', { error });
          return false;
        }
      },
      logout: () => {
        debug.log('Logout');
        // Clear stored accounts on logout for security
        if (typeof window !== 'undefined') {
          localStorage.removeItem('storedAccounts');
          sessionStorage.removeItem('accountIdentifier');
        }
        set({ user: null, isAuthenticated: false });
      },
      updateProfile: (data) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }))
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeConnection: null,
      currentRole: 'ACCOUNTADMIN',
      rolesRefreshTick: 0,
      schemaSidebarOpen: true,
      schemaSidebarWidth: 300,
      sqlEditorTabs: [
        { id: 'tab1', name: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }) + ' ' + new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }), content: 'SELECT * FROM customers LIMIT 10;' }
      ],
      openTabs: ['tab1'], // Track which tabs are currently open
      activeSqlTab: 'tab1',
      chatMessages: [],
      setActiveConnection: (id) => {
        debug.log('Setting active connection', { id });
        set({ activeConnection: id });
      },
      setCurrentRole: (role) => {
        debug.log('Setting current role', { role });
        set({ currentRole: role });
      },
      bumpRolesRefresh: () => {
        set({ rolesRefreshTick: Date.now() });
      },
      setSchemaSidebarOpen: (open) => {
        debug.log('Setting schema sidebar open', { open });
        set({ schemaSidebarOpen: open });
      },
      setSchemaSidebarWidth: (width) => {
        debug.log('Setting schema sidebar width', { width });
        set({ schemaSidebarWidth: width });
      },
      addSqlTab: (tab) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        });
        const timeStr = now.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        // Use provided ID if available, otherwise generate one
        const id = tab.id || `tab${Date.now()}`;
        const newTab = {
          id,
          name: tab.name || `${dateStr} ${timeStr}`,
          content: tab.content || '',
          connectionId: tab.connectionId
        };
        debug.log('Adding SQL tab', { newTab });
        set((state) => ({
          sqlEditorTabs: [...state.sqlEditorTabs, newTab],
          openTabs: [...state.openTabs, id],
          activeSqlTab: id
        }));
      },
      removeSqlTab: (id) => {
        debug.log('Removing SQL tab', { id });
        set((state) => {
          const newOpenTabs = state.openTabs.filter(tabId => tabId !== id);
          let newActiveTab = state.activeSqlTab;
          
          // If we're closing the active tab, switch to another open tab
          if (state.activeSqlTab === id) {
            if (newOpenTabs.length > 0) {
              // Find the index of the closed tab in the original openTabs array
              const closedTabIndex = state.openTabs.indexOf(id);
              // Try to switch to the tab to the right, or left if at the end
              if (closedTabIndex < newOpenTabs.length) {
                newActiveTab = newOpenTabs[closedTabIndex];
              } else if (newOpenTabs.length > 0) {
                newActiveTab = newOpenTabs[newOpenTabs.length - 1];
              } else {
                newActiveTab = '';
              }
            } else {
              newActiveTab = '';
            }
          }
          
          return {
            openTabs: newOpenTabs,
            activeSqlTab: newActiveTab
          };
        });
      },
      deleteWorksheet: (id) => {
        debug.log('Deleting worksheet', { id });
        set((state) => {
          // Remove from both openTabs and sqlEditorTabs (permanent deletion)
          const newTabs = state.sqlEditorTabs.filter(tab => tab.id !== id);
          const newOpenTabs = state.openTabs.filter(tabId => tabId !== id);
          const newActiveTab = state.activeSqlTab === id 
            ? (newOpenTabs.length > 0 ? newOpenTabs[0] : '') 
            : state.activeSqlTab;
          return {
            sqlEditorTabs: newTabs,
            openTabs: newOpenTabs,
            activeSqlTab: newActiveTab
          };
        });
      },
      updateSqlTab: (id, content) => {
        debug.log('Updating SQL tab', { id, contentLength: content.length });
        set((state) => ({
          sqlEditorTabs: state.sqlEditorTabs.map(tab =>
            tab.id === id ? { ...tab, content } : tab
          )
        }));
      },
      updateSqlTabName: (id, name) => {
        debug.log('Updating SQL tab name', { id, name });
        set((state) => ({
          sqlEditorTabs: state.sqlEditorTabs.map(tab =>
            tab.id === id ? { ...tab, name } : tab
          )
        }));
      },
      reorderSqlTabs: (sourceId, targetId) => {
        debug.log('Reordering SQL tabs', { sourceId, targetId });
        set((state) => {
          const tabs = [...state.sqlEditorTabs];
          const sourceIndex = tabs.findIndex(tab => tab.id === sourceId);
          const targetIndex = tabs.findIndex(tab => tab.id === targetId);
          
          if (sourceIndex === -1 || targetIndex === -1) return state;
          
          // Remove source tab and insert it at target position
          const [sourceTab] = tabs.splice(sourceIndex, 1);
          tabs.splice(targetIndex, 0, sourceTab);
          
          return { sqlEditorTabs: tabs };
        });
      },
      setActiveSqlTab: (id) => {
        debug.log('Setting active SQL tab', { id });
        set((state) => {
          // If the tab is not open, add it to openTabs
          const isTabOpen = state.openTabs.includes(id);
          if (!isTabOpen) {
            return {
              activeSqlTab: id,
              openTabs: [...state.openTabs, id]
            };
          }
          return { activeSqlTab: id };
        });
      },
      addChatMessage: (message) => {
        debug.log('Adding chat message', { message });
        const newMessage: ChatMessage = {
          id: `msg${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...message
        };
        set((state) => ({
          chatMessages: [...state.chatMessages, newMessage]
        }));
      }
    }),
    {
      name: 'app-storage',
    }
  )
);