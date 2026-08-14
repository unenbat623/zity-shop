import { create } from 'zustand';
import { OdooConfig, OdooSyncLog } from '../types';
import { odooService, OdooMode } from '../services/odooService';
import { useCatalogStore } from './useCatalogStore';

interface OdooState {
  config: OdooConfig;
  logs: OdooSyncLog[];
  mode: OdooMode;
  isSyncing: boolean;
  isTesting: boolean;
  lastResult: { ok: boolean; message: string } | null;

  updateConfig: (newConfig: Partial<Pick<OdooConfig, 'url' | 'db' | 'username' | 'autoSync'>>) => void;
  testConnection: () => Promise<boolean>;
  triggerSync: () => Promise<void>;
  clearResult: () => void;
}

function snapshot() {
  return {
    config: odooService.getConfig(),
    logs: odooService.getLogs(),
    mode: odooService.getMode(),
  };
}

export const useOdooStore = create<OdooState>((set) => ({
  ...snapshot(),
  isSyncing: false,
  isTesting: false,
  lastResult: null,

  updateConfig: (newConfig) => {
    odooService.updateConfig(newConfig);
    set({ ...snapshot() });
  },

  testConnection: async () => {
    set({ isTesting: true, lastResult: null });
    const result = await odooService.testConnection();
    set({ ...snapshot(), isTesting: false, lastResult: { ok: result.success, message: result.message } });
    return result.success;
  },

  triggerSync: async () => {
    set({ isSyncing: true, lastResult: null });

    // Odoo bridge болон Zity Chef каталогийг зэрэг шинэчилнэ
    const [odooResult] = await Promise.all([
      odooService.fetchProducts(),
      useCatalogStore.getState().loadProducts({ force: true }),
    ]);

    set({
      ...snapshot(),
      isSyncing: false,
      lastResult: {
        ok: odooResult.mode === 'bridge',
        message:
          odooResult.mode === 'bridge'
            ? `Odoo-с ${odooResult.products.length} бараа шинэчлэгдлээ.`
            : 'Odoo bridge холбогдоогүй тул Zity Chef / локал каталогоор шинэчиллээ.',
      },
    });
  },

  clearResult: () => set({ lastResult: null }),
}));
