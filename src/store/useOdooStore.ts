import { create } from 'zustand';
import { OdooConfig, OdooSyncLog } from '../types';
import { odooService } from '../services/odooService';

interface OdooState {
  config: OdooConfig;
  logs: OdooSyncLog[];
  isSyncing: boolean;
  updateConfig: (newConfig: Partial<OdooConfig>) => Promise<void>;
  testConnection: () => Promise<boolean>;
  triggerSync: () => Promise<void>;
}

export const useOdooStore = create<OdooState>((set, get) => ({
  config: odooService.getConfig(),
  logs: odooService.getLogs(),
  isSyncing: false,

  updateConfig: async (newConfig) => {
    await odooService.updateConfig(newConfig);
    set({ config: odooService.getConfig(), logs: odooService.getLogs() });
  },

  testConnection: async () => {
    set({ isSyncing: true });
    const result = await odooService.testConnection();
    set({
      isSyncing: false,
      config: odooService.getConfig(),
      logs: odooService.getLogs(),
    });
    return result.success;
  },

  triggerSync: async () => {
    set({ isSyncing: true });
    await odooService.fetchProducts();
    set({
      isSyncing: false,
      config: odooService.getConfig(),
      logs: odooService.getLogs(),
    });
  },
}));
