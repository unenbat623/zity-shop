import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Ачаалж байгааг илэрхийлэх placeholder.
 * Өнгө нь theme token-оос ирдэг тул харанхуй горимд ч зөв харагдана.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-hover', className)}
      {...props}
    />
  );
}

export { Skeleton };
