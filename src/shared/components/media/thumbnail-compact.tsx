'use client';

import type { PhotoPreviewItem } from '@/shared/components/ui/photo-preview';

export type ThumbnailCompactPhoto = PhotoPreviewItem;

type ThumbnailCompactProps = {
  photos: ThumbnailCompactPhoto[];
  onPhotoClick?: (photo: ThumbnailCompactPhoto, index: number) => void;
  // Appended after "Xem ảnh {n}" for entities that want context in the accessible name, e.g.
  // ariaLabelSuffix="của Nancy House Grand" -> "Xem ảnh 1 của Nancy House Grand". The component
  // itself stays unaware of what kind of entity that is.
  ariaLabelSuffix?: string;
};

const MAX_VISIBLE = 3;
const STACK_WIDTH = 62;
const STACK_HEIGHT = 58;
// z-index reserved for whichever visible card carries the "+N" overlay, so the count stays fully
// legible/clickable regardless of the card's normal front/back stacking position (see FRONT/BACK
// note below).
const OVERLAY_CARD_Z = 40;

type StackPosition = { x: number; y: number; rotate: number; z: number };

// Stacked physical-photo-card geometry, not a symmetric fan: index 0 is always the dominant FRONT
// card (highest z among the base set); each following index sits further back, offset up-and-right,
// with a slightly steeper rotation, so rear cards peek out from the upper-right corner behind the
// front card — matching the reference (front card dominant, back card exposed at the top-right).
const STACK_POSITIONS: Record<number, StackPosition[]> = {
  1: [{ x: 0, y: 8, rotate: 0, z: 30 }],
  2: [
    { x: 0, y: 8, rotate: -4, z: 20 },
    { x: 10, y: 0, rotate: 5, z: 10 },
  ],
  3: [
    { x: 0, y: 10, rotate: -5, z: 30 },
    { x: 8, y: 5, rotate: 1, z: 20 },
    { x: 14, y: 0, rotate: 6, z: 10 },
  ],
};

export function resolveVisibleThumbnails<TPhoto>(
  photos: TPhoto[],
  maxVisible: number = MAX_VISIBLE,
): { visible: TPhoto[]; hiddenCount: number } {
  return {
    visible: photos.slice(0, maxVisible),
    hiddenCount: Math.max(photos.length - maxVisible, 0),
  };
}

export function ThumbnailCompact({ photos, onPhotoClick, ariaLabelSuffix }: ThumbnailCompactProps) {
  if (photos.length === 0) {
    return null;
  }

  const { visible, hiddenCount } = resolveVisibleThumbnails(photos, MAX_VISIBLE);
  const positions = STACK_POSITIONS[visible.length] ?? STACK_POSITIONS[1]!;

  return (
    <div className="relative shrink-0" style={{ width: STACK_WIDTH, height: STACK_HEIGHT }}>
      {visible.map((photo, index) => {
        const position = positions[index]!;
        const isOverlayCard = index === visible.length - 1 && hiddenCount > 0;
        const label = `Xem ảnh ${index + 1}${ariaLabelSuffix ? ` ${ariaLabelSuffix}` : ''}`;

        return (
          <button
            aria-label={label}
            className="absolute size-12 overflow-hidden rounded-[var(--radius-ds-sm)] border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1"
            key={photo.id}
            onClick={() => onPhotoClick?.(photo, index)}
            style={{
              left: position.x,
              top: position.y,
              transform: `rotate(${position.rotate}deg)`,
              zIndex: isOverlayCard ? OVERLAY_CARD_Z : position.z,
            }}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- external R2/user-provided URL, next/image domain not configured */}
            <img alt="" className="size-full object-cover" src={photo.url} />
            {isOverlayCard ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-xs font-semibold text-white"
              >
                +{hiddenCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
