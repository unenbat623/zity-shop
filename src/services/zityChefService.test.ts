import { describe, expect, it } from 'vitest';
import {
  toCategorySlug,
  toChefCategory,
  toChefPaymentMethod,
  toChefUnit,
} from './zityChefService';

/**
 * Эдгээр хөрвүүлэлт нь Chef-ийн Postgres CHECK constraint-той нягт холбоотой.
 * Буруу утга илгээвэл insert 502 өгч, захиалгын орц хөргөгчид ОГТ нэмэгдэхгүй
 * бөгөөд алдаа нь чимээгүй өнгөрдөг. Тиймээс энд тестээр бэхлэв.
 */

describe('toChefUnit', () => {
  it('кг-г гр болгож, тоог 1000 дахин нэмэгдүүлнэ', () => {
    expect(toChefUnit('кг', 2)).toEqual({ unit: 'гр', quantity: 2000 });
    expect(toChefUnit('KG', 0.5)).toEqual({ unit: 'гр', quantity: 500 });
  });

  it('Chef-ийн зөвшөөрсөн нэгжийг хэвээр үлдээнэ', () => {
    expect(toChefUnit('гр', 250)).toEqual({ unit: 'гр', quantity: 250 });
    expect(toChefUnit('л', 3)).toEqual({ unit: 'л', quantity: 3 });
    expect(toChefUnit('ш', 12)).toEqual({ unit: 'ш', quantity: 12 });
  });

  it('мл-г литр болгож хөрвүүлнэ', () => {
    expect(toChefUnit('мл', 500)).toEqual({ unit: 'л', quantity: 0.5 });
  });

  it('танихгүй нэгжийг ш болгоно (constraint зөрчихөөс сэргийлнэ)', () => {
    expect(toChefUnit('боодол', 4)).toEqual({ unit: 'ш', quantity: 4 });
    expect(toChefUnit('', 1)).toEqual({ unit: 'ш', quantity: 1 });
  });

  it('буцаасан нэгж нь үргэлж Chef-ийн зөвшөөрсөн жагсаалтад багтана', () => {
    const allowed = ['гр', 'л', 'ш', 'g', 'l', 'pcs'];
    for (const unit of ['кг', 'мл', 'литр', 'ш', 'багц', 'порц', 'Кг', '']) {
      expect(allowed).toContain(toChefUnit(unit, 1).unit);
    }
  });
});

describe('toChefCategory', () => {
  it('Chef-ийн ангиллыг хэвээр дамжуулна', () => {
    expect(toChefCategory('🥩 Мах', 'meat')).toBe('🥩 Мах');
    expect(toChefCategory('🍎 Жимс', 'fruits')).toBe('🍎 Жимс');
  });

  it('Delguur-ийн ангиллыг slug-аар нь буулгана', () => {
    expect(toChefCategory('Мах, махан бүтээгдэхүүн', 'meat')).toBe('🥩 Мах');
    expect(toChefCategory('Сүүн бүтээгдэхүүн', 'dairy')).toBe('🥛 Сүү, өндөг');
    expect(toChefCategory('Соус, амтлагч', 'spices')).toBe('🧂 Амтлагч');
  });

  it('танихгүй ангиллыг ногоо болгоно', () => {
    expect(toChefCategory('Ахуйн бараа', 'household')).toBe('🥦 Ногоо');
  });

  it('буцаасан ангилал нь үргэлж зөвшөөрөгдсөн жагсаалтад багтана', () => {
    const allowed = ['🥦 Ногоо', '🥩 Мах', '🥛 Сүү, өндөг', '🧂 Амтлагч', '🍎 Жимс'];
    const slugs = ['meat', 'dairy', 'fruits', 'spices', 'household', 'bakery', 'drinks', 'unknown'];
    for (const slug of slugs) {
      expect(allowed).toContain(toChefCategory('ямар нэг', slug));
    }
  });
});

describe('toChefPaymentMethod', () => {
  it('Chef дэмждэг хэлбэрийг хэвээр үлдээнэ', () => {
    expect(toChefPaymentMethod('qpay')).toBe('qpay');
    expect(toChefPaymentMethod('socialpay')).toBe('socialpay');
    expect(toChefPaymentMethod('card')).toBe('card');
  });

  it('Chef дэмждэггүй хэлбэрийг хамгийн ойр утгаар солино', () => {
    // MonPay нь QR түрийвч тул qpay-д хамгийн ойр
    expect(toChefPaymentMethod('monpay')).toBe('qpay');
    expect(toChefPaymentMethod('cod')).toBe('card');
  });

  it('буцаасан утга нь үргэлж Chef-ийн зөвшөөрсөн жагсаалтад багтана', () => {
    const allowed = ['qpay', 'socialpay', 'card'];
    for (const method of ['qpay', 'socialpay', 'card', 'monpay', 'cod'] as const) {
      expect(allowed).toContain(toChefPaymentMethod(method));
    }
  });
});

describe('toCategorySlug', () => {
  it('Chef-ийн emoji-тэй ангиллыг таньдаг', () => {
    expect(toCategorySlug('🥩 Мах')).toBe('meat');
    expect(toCategorySlug('🥦 Ногоо')).toBe('vegetables');
    expect(toCategorySlug('🥛 Сүү, өндөг')).toBe('dairy');
    expect(toCategorySlug('🍎 Жимс')).toBe('fruits');
  });

  it('Delguur-ийн бүтэн нэрийг таньдаг', () => {
    expect(toCategorySlug('Мах, махан бүтээгдэхүүн')).toBe('meat');
    expect(toCategorySlug('Гурилан бүтээгдэхүүн')).toBe('bakery');
    expect(toCategorySlug('Ундаа, ус')).toBe('drinks');
  });

  it('танихгүй ангиллыг zity-chef болгоно', () => {
    expect(toCategorySlug('Тодорхойгүй')).toBe('zity-chef');
  });
});
