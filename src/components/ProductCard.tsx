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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-surface border border-border/80 shadow-xs transition-all hover:shadow-lg hover:border-emerald-500/40 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-surface-hover">
        {!imageLoaded && <Skeleton className="absolute inset-0" />}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient Overlay for card depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-black/20" />

        {/* Discount Badge */}
        {product.discountPrice && (
          <div className="absolute top-2.5 left-2.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md">
            -{discountPercent}%
          </div>
        )}

        {/* Mongolian / Organic Badges */}
        {(product.isMongolian || product.isOrganic) && (
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1">
            {product.isMongolian && (
              <span className="rounded-full bg-blue-600/90 px-2 py-0.5 text-[9px] font-black text-white shadow-xs backdrop-blur-md">
                🇲🇳 МН
              </span>
            )}
            {product.isOrganic && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[9px] font-black text-white shadow-xs backdrop-blur-md">
                🌿 OG
              </span>
            )}
          </div>
        )}

        {/* Stock status indicator */}
        {product.stock <= 10 && (
          <div className="absolute bottom-2 left-2 right-2 rounded-full bg-amber-500/90 py-0.5 text-center text-[9px] font-black text-slate-950 backdrop-blur-md shadow-xs">
            ⚠ {product.stock} {product.unit} үлдлээ
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Category & SKU subtitle */}
        <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-emerald-600">
          <span className="truncate">{product.category}</span>
          {product.sku && <span className="font-mono text-text-muted text-[9px] shrink-0">{product.sku}</span>}
        </div>

        {/* Product Name */}
        <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-text-main leading-snug mb-3">
          {product.name}
        </h3>

        {/* Bottom Price & Add Action */}
        <div className="mt-auto flex items-end justify-between gap-1 pt-1 border-t border-border/50">
          {/* Price Tag */}
          <div className="flex flex-col">
            {product.discountPrice ? (
              <>
                <span className="text-[10px] text-text-muted line-through font-medium">
                  {product.price.toLocaleString()}₮
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-600">
                  ₮{product.discountPrice.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-black text-text-main">
                ₮{product.price.toLocaleString()}
              </span>
            )}
            <span className="text-[9px] text-text-muted font-semibold">/ {product.unit}</span>
          </div>

          {/* Add to Cart Circular Action Button */}
          {quantity > 0 ? (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 p-1 border border-emerald-500/30">
              <button
                onClick={handleRemove}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-emerald-600 shadow-xs hover:bg-surface-hover active:scale-90 transition-all"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[16px] text-center text-xs font-black text-emerald-600">{quantity}</span>
              <button
                onClick={handleAdd}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700 active:scale-90 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-700 active:scale-90 transition-all"
              title="Сагсанд нэмэх"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
