import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { useToastStore } from '../store/useToastStore';
import { Skeleton } from './ui/Skeleton';
import { formatMnt } from '../lib/format';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const quantity = useCartStore((state) => state.getItemQuantity(product.id));
  const { addItem, decreaseQuantity } = useCartStore();
  const showToast = useToastStore((state) => state.show);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 10;
  const hasReachedStock = quantity >= product.stock;

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAdd = (event: React.MouseEvent) => {
    event.stopPropagation();
    const result = addItem(product);
    // Амжилттай нэмэхэд toast гаргахгүй — тоо шууд өөрчлөгдөж харагдана.
    // Зөвхөн саад тохиолдвол шалтгааныг мэдэгдэнэ.
    if (!result.ok) showToast(result.message, 'warning');
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    decreaseQuantity(product.id);
  };

  return (
    <div
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(product);
        }
      }}
      aria-label={`${product.name}, ${formatMnt(product.discountPrice ?? product.price)}`}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg active:scale-[0.98] ${
        isOutOfStock ? 'opacity-70' : ''
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface-hover">
        {!imageLoaded && !imageFailed && <Skeleton className="absolute inset-0" />}

        {imageFailed ? (
          <div className="flex h-full w-full items-center justify-center text-3xl">🛒</div>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />

        {product.discountPrice && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md">
            -{discountPercent}%
          </span>
        )}

        {(product.isMongolian || product.isOrganic) && (
          <div className="absolute right-2.5 top-2.5 flex flex-col gap-1">
            {product.isMongolian && (
              <span className="rounded-full bg-blue-600/90 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-md">
                🇲🇳 МН
              </span>
            )}
            {product.isOrganic && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-md">
                🌿 OG
              </span>
            )}
          </div>
        )}

        {isOutOfStock ? (
          <div className="absolute inset-x-2 bottom-2 rounded-full bg-slate-900/85 py-1 text-center text-[10px] font-black text-white backdrop-blur-md">
            Нөөц дууссан
          </div>
        ) : (
          isLowStock && (
            <div className="absolute inset-x-2 bottom-2 rounded-full bg-amber-500/90 py-0.5 text-center text-[9px] font-black text-slate-950 backdrop-blur-md">
              ⚠ {product.stock} {product.unit} үлдлээ
            </div>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="mb-1 flex items-center justify-between gap-1 text-[10px] font-bold text-emerald-600">
          <span className="truncate">{product.category}</span>
          {product.sku && (
            <span className="shrink-0 font-mono text-[9px] text-text-subtle">{product.sku}</span>
          )}
        </div>

        <h3 className="mb-3 line-clamp-2 text-xs font-bold leading-snug text-text-main sm:text-sm">
          {product.name}
        </h3>

        {/*
          Үнэ ба үйлдлийг ДЭЭР-ДООР байрлуулна.
          Хажуу тийш байрлуулбал картын доторх өргөн (жижиг дэлгэцэнд ~100px)
          хоёуланд нь хүрэлцэхгүй тул үнэ шахагдаж, текст нь тоо ширхгийн
          удирдлага дээр халин гардаг байв.
        */}
        <div className="mt-auto space-y-2 border-t border-border/60 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            {product.discountPrice ? (
              <>
                <span className="text-sm font-black text-emerald-600 sm:text-base">
                  {formatMnt(product.discountPrice)}
                </span>
                <span className="text-[10px] font-medium text-text-subtle line-through">
                  {formatMnt(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-black text-text-main sm:text-base">
                {formatMnt(product.price)}
              </span>
            )}
            <span className="text-[9px] font-semibold text-text-subtle">/ {product.unit}</span>
          </div>

          {isOutOfStock ? (
            <span className="block rounded-full border border-border bg-surface-hover py-2 text-center text-[10px] font-bold text-text-muted">
              Нөөц дууссан
            </span>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-between rounded-full border border-emerald-500/30 bg-emerald-500/10 p-1">
              <button
                onClick={handleRemove}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-emerald-600 shadow-xs transition-all hover:bg-surface-hover active:scale-90"
                aria-label="Тоо хасах"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-xs font-black text-emerald-600">{quantity}</span>
              <button
                onClick={handleAdd}
                disabled={hasReachedStock}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-all hover:bg-emerald-700 active:scale-90 disabled:opacity-40"
                aria-label="Тоо нэмэх"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-1 rounded-full bg-emerald-600 py-2 text-[11px] font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-95"
              aria-label={`${product.name} сагсанд нэмэх`}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">Сагслах</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
