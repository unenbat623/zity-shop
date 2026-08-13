import { Order, Product, OdooConfig, OdooSyncLog } from '../types';
import { MOCK_PRODUCTS } from '../constants/mockData';

export class OdooService {
  private static instance: OdooService;
  private config: OdooConfig = {
    url: (import.meta as any).env?.VITE_ODOO_URL || 'https://odoo.zity.mn',
    db: (import.meta as any).env?.VITE_ODOO_DB || 'zity_delguur_db',
    username: (import.meta as any).env?.VITE_ODOO_USERNAME || 'api_admin@zity.mn',
    apiKey: (import.meta as any).env?.VITE_ODOO_API_KEY || '',
    isConnected: true,
    autoSync: true,
    lastSyncTime: new Date().toISOString(),
  };

  private syncLogs: OdooSyncLog[] = [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('mn-MN'),
      action: 'ERP Барааны нөөц синк хийсэн',
      status: 'success',
      message: 'Odoo-с 15 барааны үнэ болон нөөц амжилттай шинэчлэгдлээ.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1800000).toLocaleTimeString('mn-MN'),
      action: 'Zity Chef Орц синк',
      status: 'success',
      message: 'Zity Chef хоолны цэс багцын мэдээлэл холбогдлоо.',
    }
  ];

  public static getInstance(): OdooService {
    if (!OdooService.instance) {
      OdooService.instance = new OdooService();
    }
    return OdooService.instance;
  }

  public getConfig(): OdooConfig {
    return { ...this.config };
  }

  public getLogs(): OdooSyncLog[] {
    return [...this.syncLogs];
  }

  public async updateConfig(newConfig: Partial<OdooConfig>): Promise<boolean> {
    this.config = { ...this.config, ...newConfig };
    this.addLog('Odoo тохиргоо шинэчлэгдлээ', 'success', 'ERP холболтын тохиргоо амжилттай хадгалагдлаа.');
    return true;
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    // Simulating Odoo JSON-RPC authentication (/xmlrpc/2/common)
    await new Promise((resolve) => setTimeout(resolve, 800));
    this.config.isConnected = true;
    this.config.lastSyncTime = new Date().toISOString();
    this.addLog('Odoo холболт шалгах', 'success', 'Odoo ERP системтэй амжилттай холбогдлоо (Session ID: 0x9F412)');
    return { success: true, message: 'Odoo ERP холболт амжилттай!' };
  }

  public async fetchProducts(): Promise<Product[]> {
    // Simulating Odoo model search_read ('product.product')
    await new Promise((resolve) => setTimeout(resolve, 600));
    this.config.lastSyncTime = new Date().toISOString();
    this.addLog('Odoo Бараа татах', 'success', `${MOCK_PRODUCTS.length} барааны мэдээлэл Odoo ERP-с татагдлаа.`);
    return MOCK_PRODUCTS;
  }

  public async pushOrderToOdoo(order: Order): Promise<{ odooOrderRef: string; success: boolean }> {
    // Simulating Odoo model create ('sale.order') and ('sale.order.line')
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const odooOrderRef = `SO-${new Date().getFullYear()}-${randomId}`;

    this.addLog(
      'Odoo Захиалга үүсгэх',
      'success',
      `Захиалга ${order.id} Odoo ERP руу шилжлээ. Odoo Ref: ${odooOrderRef} (Дүн: ${order.totalAmount.toLocaleString()}₮)`
    );

    return {
      odooOrderRef,
      success: true,
    };
  }

  public addLog(action: string, status: 'success' | 'warning' | 'error', message: string) {
    const newLog: OdooSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('mn-MN'),
      action,
      status,
      message,
    };
    this.syncLogs.unshift(newLog);
    if (this.syncLogs.length > 20) {
      this.syncLogs.pop();
    }
  }
}

export const odooService = OdooService.getInstance();
