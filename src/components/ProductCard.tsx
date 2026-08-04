import React, { useState } from 'react';
import { Plus, Minus, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { Skeleton } from './ui/Skeleton';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { items, addItem, decreaseQuantity } = useCartStore();

  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    decreaseQuantity(product.id);
  };

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div
      onClick={() => onClick(product)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface border border-border shadow-xs transition-all hover:shadow-md hover:border-emerald-500/30 active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-hover">
        {!imageLoaded && <Skeleton className="absolute inset-0" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Discount Badge */}
        {product.discountPrice && (
          <div className="absolute top-2 left-2 rounded-lg bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            -{discountPercent}%
          </div>
        )}

        {/* Mongolian / Organic Badge */}
        {(product.isMongolian || product.isOrganic) && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {product.isMongolian && (
              <span className="rounded-full bg-blue-600/80 px-1.5 py-0.5 text-[8px] font-extrabold text-white backdrop-blur-sm">
                🇲🇳 МН
              </span>
            )}
            {product.isOrganic && (
              <span className="rounded-full bg-emerald-600/80 px-1.5 py-0.5 text-[8px] font-extrabold text-white backdrop-blur-sm">
                🌿 OG
              </span>
            )}
          </div>
        )}

        {/* Low-stock badge */}
        {product.stock <= 10 && (
          <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-amber-500/90 py-0.5 text-center text-[9px] font-extrabold text-white backdrop-blur-sm">
            ⚠ Зөвхөн {product.stock} {product.unit} үлдлээ
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        {/* Odoo source tag */}
        {product.odooId && (
          <div className="mb-1 flex items-center gap-1 text-[9px] font-mono text-text-muted">
            <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
            <span>{product.sku}</span>
          </div>
        )}

        <h3 className="line-clamp-2 text-xs font-bold text-text-main leading-tight mb-2">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-1">
          {/* Price */}
          <div className="flex flex-col">
            {product.discountPrice ? (
              <>
                <span className="text-[10px] text-text-muted line-through">
                  {product.price.toLocaleString()}₮
                </span>
                <span className="text-sm font-extrabold text-emerald-600">
                  {product.discountPrice.toLocaleString()}₮
                </span>
              </>
            ) : (
              <span className="text-sm font-extrabold text-text-main">
                {product.price.toLocaleString()}₮
              </span>
            )}
            <span className="text-[9px] text-text-muted font-medium">/ {product.unit}</span>
          </div>

          {/* Add / Stepper */}
          {quantity > 0 ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1 py-0.5 border border-emerald-500/20">
              <button
                onClick={handleRemove}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-emerald-600 shadow-xs hover:bg-surface-hover active:scale-90 transition-all"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[14px] text-center text-xs font-extrabold text-emerald-600">{quantity}</span>
              <button
                onClick={handleAdd}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-90 transition-all"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-90 transition-all"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
