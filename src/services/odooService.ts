/**
 * Odoo ERP интеграцийн давхарга.
 *
 * ⚠️ ЧУХАЛ: Odoo JSON-RPC руу browser-оос ШУУД хандахгүй. Шалтгаан:
 *   1. Odoo API key / нууц үг frontend bundle-д ил гарна
 *   2. Odoo нь CORS-г үндсэндээ зөвшөөрдөггүй
 *
 * Тиймээс энэ модуль хоёр горимоор ажиллана:
 *   - `bridge`  — Zity Chef backend дээрх `/api/odoo/*` proxy руу хүсэлт илгээнэ (production зам)
 *   - `simulated` — proxy байхгүй үед UI-г бүрэн ажиллуулах симуляц (dev/demo)
 *
 * Горим нь автоматаар тодорхойлогдоно: bridge endpoint хариу өгвөл `bridge`, эс бөгөөс `simulated`.
 */

import { ApiError, chefRequest } from './apiClient';
import { OdooConfig, OdooSyncLog, Order, Product } from '../types';
import { env, isDemoMode } from '../lib/env';
import { MOCK_PRODUCTS } from '../constants/mockData';

export type OdooMode = 'bridge' | 'simulated';

interface OdooBridgeOrderResponse {
  odooOrderRef?: string;
  name?: string;
  id?: number | string;
}

const MAX_LOGS = 30;

class OdooService {
  private mode: OdooMode = 'simulated';

  private config: OdooConfig = {
    url: env.odoo.url,
    db: env.odoo.db,
    username: env.odoo.username,
    // API key нь зөвхөн backend дээр байна — frontend хэзээ ч барихгүй
    apiKey: '',
    isConnected: false,
    autoSync: true,
    lastSyncTime: null,
  };

  private syncLogs: OdooSyncLog[] = [];

  getConfig(): OdooConfig {
    return { ...this.config };
  }

  getMode(): OdooMode {
    return this.mode;
  }

  getLogs(): OdooSyncLog[] {
    return [...this.syncLogs];
  }

  /** Зөвхөн холболтын хаяг/DB-г шинэчилнэ. Нууц түлхүүр энд хадгалагдахгүй. */
  updateConfig(newConfig: Partial<Pick<OdooConfig, 'url' | 'db' | 'username' | 'autoSync'>>): void {
    this.config = { ...this.config, ...newConfig };
    this.addLog(
      'Odoo тохиргоо шинэчлэгдлээ',
      'success',
      `Endpoint: ${this.config.url} · DB: ${this.config.db}`
    );
  }

  /** Backend дээрх Odoo bridge ажиллаж байгаа эсэхийг шалгана */
  async testConnection(): Promise<{ success: boolean; message: string; mode: OdooMode }> {
    try {
      const response = await chefRequest<{ connected?: boolean; db?: string; version?: string }>(
        '/odoo/status',
        { timeoutMs: 6000 }
      );

      this.mode = 'bridge';
      this.config.isConnected = response?.connected !== false;
      this.config.lastSyncTime = new Date().toISOString();
      if (response?.db) this.config.db = response.db;

      const message = this.config.isConnected
        ? `Odoo ERP холбогдлоо${response?.version ? ` (v${response.version})` : ''}.`
        : 'Odoo bridge хариу өгсөн ч ERP холболт идэвхгүй байна.';

      this.addLog('Odoo холболт шалгах', this.config.isConnected ? 'success' : 'warning', message);
      return { success: this.config.isConnected, message, mode: 'bridge' };
    } catch (error) {
      this.mode = 'simulated';
      this.config.isConnected = false;

      const detail = error instanceof ApiError ? error.userMessage : 'Odoo bridge олдсонгүй.';
      const message = `${detail} Симуляц горимд ажиллаж байна.`;
      this.addLog('Odoo холболт шалгах', 'warning', message);
      return { success: false, message, mode: 'simulated' };
    }
  }

  /** Odoo-с барааны каталог татах (bridge горимд). Симуляцад локал каталог буцаана. */
  async fetchProducts(): Promise<{ products: Product[]; mode: OdooMode }> {
    try {
      const response = await chefRequest<{ products?: Product[] }>('/odoo/products', {
        timeoutMs: 10_000,
      });

      if (Array.isArray(response?.products) && response.products.length > 0) {
        this.mode = 'bridge';
        this.config.isConnected = true;
        this.config.lastSyncTime = new Date().toISOString();
        this.addLog(
          'Odoo бараа татах',
          'success',
          `${response.products.length} барааны үнэ/нөөц Odoo-с шинэчлэгдлээ.`
        );
        return { products: response.products, mode: 'bridge' };
      }

      throw new ApiError('http', '/odoo/products', 'Хоосон каталог.', 204);
    } catch {
      this.mode = 'simulated';
      this.config.lastSyncTime = new Date().toISOString();
      this.addLog(
        'Odoo бараа татах',
        'warning',
        `Odoo bridge холбогдоогүй тул локал каталог (${MOCK_PRODUCTS.length} бараа) ашиглалаа.`
      );
      return { products: MOCK_PRODUCTS, mode: 'simulated' };
    }
  }

  /**
   * Захиалгыг Odoo `sale.order` болгож бүртгэнэ.
   *
   * Bridge байхгүй үед:
   *   - демо горимд — симуляцын reference үүсгээд `success: true` (UI урсгал тасрахгүй)
   *   - production-д — `success: false`. ERP дээр захиалга үүсээгүй атлаа "амжилттай"
   *     гэж харуулбал ажилтан захиалгыг хаанаас ч олохгүй, хэрэглэгч хүлээсээр
   *     үлдэнэ. Тиймээс илэн далангүй амжилтгүй гэж тэмдэглэнэ.
   */
  async pushOrderToOdoo(order: Order): Promise<{ odooOrderRef: string; success: boolean; mode: OdooMode }> {
    try {
      const response = await chefRequest<OdooBridgeOrderResponse>('/odoo/orders', {
        method: 'POST',
        timeoutMs: 12_000,
        body: {
          externalOrderId: order.id,
          partner: {
            name: order.address.phone,
            phone: order.address.phone,
            street: `${order.address.district}, ${order.address.khoroo}, ${order.address.streetBuilding}`,
          },
          lines: order.items.map((item) => ({
            odooId: item.odooId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            priceUnit: item.discountPrice ?? item.price,
          })),
          amountTotal: order.totalAmount,
          deliveryFee: order.deliveryFee,
          discount: order.discountAmount,
          paymentMethod: order.paymentMethod,
        },
      });

      const odooOrderRef = response?.odooOrderRef || response?.name || `SO-${response?.id ?? order.id}`;
      this.mode = 'bridge';
      this.config.isConnected = true;
      this.config.lastSyncTime = new Date().toISOString();

      this.addLog(
        'Odoo захиалга үүсгэх',
        'success',
        `${order.id} → Odoo ${odooOrderRef} (${order.totalAmount.toLocaleString('mn-MN')}₮)`
      );

      return { odooOrderRef, success: true, mode: 'bridge' };
    } catch {
      this.mode = 'simulated';
      this.config.isConnected = false;

      if (isDemoMode()) {
        const odooOrderRef = `SIM-SO-${new Date().getFullYear()}-${order.id.slice(-4)}`;
        this.addLog(
          'Odoo захиалга үүсгэх',
          'warning',
          `Odoo bridge олдсонгүй. ${order.id} захиалгад ДЕМО reference (${odooOrderRef}) олголоо.`
        );
        return { odooOrderRef, success: true, mode: 'simulated' };
      }

      this.addLog(
        'Odoo захиалга үүсгэх',
        'error',
        `Odoo bridge олдсонгүй. ${order.id} захиалга ERP дээр бүртгэгдээгүй — дахин илгээх шаардлагатай.`
      );

      return { odooOrderRef: 'Синк амжилтгүй', success: false, mode: 'simulated' };
    }
  }

  addLog(action: string, status: OdooSyncLog['status'], message: string): void {
    this.syncLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      status,
      message,
    });

    if (this.syncLogs.length > MAX_LOGS) {
      this.syncLogs.length = MAX_LOGS;
    }
  }
}

export const odooService = new OdooService();
