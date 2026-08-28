'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent, TransitionEvent as ReactTransitionEvent, WheelEvent as ReactWheelEvent } from 'react';
import { Drawer } from 'vaul';

import { useMediaQuery } from '@/shared/hooks/use-media-query';

export type PhotoPreviewItem = {
  id: string;
  url: string;
  alt?: string;
};

type PhotoPreviewProps = {
  items: PhotoPreviewItem[];
  initialIndex?: number;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_COMMIT_RATIO = 0.22;
const SWIPE_COMMIT_VELOCITY = 0.55;
const TAP_MOVE_TOLERANCE = 10;
const DOUBLE_TAP_WINDOW_MS = 280;
const DOUBLE_TAP_DISTANCE = 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

type GestureMode = 'idle' | 'swipe' | 'pan' | 'pinch';

type GestureState = {
  mode: GestureMode;
  startX: number;
  startY: number;
  startTime: number;
  startScale: number;
  startPan: { x: number; y: number };
  startDistance: number;
  pendingDelta: number;
  moved: boolean;
};

function createGestureState(): GestureState {
  return {
    mode: 'idle',
    startX: 0,
    startY: 0,
    startTime: 0,
    startScale: 1,
    startPan: { x: 0, y: 0 },
    startDistance: 0,
    pendingDelta: 0,
    moved: false,
  };
}

export function PhotoPreview({ items, initialIndex = 0, onClose }: PhotoPreviewProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const total = items.length;
  const [index, setIndex] = useState(() => (total > 0 ? ((initialIndex % total) + total) % total : 0));
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isGestureActive, setIsGestureActive] = useState(false);

  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef(createGestureState());
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function resetZoom() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  const navigate = useCallback(
    (delta: 1 | -1) => {
      if (total <= 1) {
        return;
      }
      const slideWidth = window.innerWidth;
      gestureRef.current.pendingDelta = delta;
      setIsAnimating(true);
      setDragX(delta === 1 ? -slideWidth : slideWidth);
    },
    [total],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        navigate(-1);
      } else if (event.key === 'ArrowRight') {
        navigate(1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onClose]);

  if (total === 0) {
    return null;
  }

  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  function clampPan(nextPan: { x: number; y: number }, nextScale: number) {
    if (nextScale <= 1) {
      return { x: 0, y: 0 };
    }
    const maxOffsetX = (window.innerWidth * (nextScale - 1)) / 2;
    const maxOffsetY = (window.innerHeight * (nextScale - 1)) / 2;
    return {
      x: clamp(nextPan.x, -maxOffsetX, maxOffsetX),
      y: clamp(nextPan.y, -maxOffsetY, maxOffsetY),
    };
  }

  function handleTap(x: number, y: number) {
    const lastTap = lastTapRef.current;
    const now = performance.now();

    if (lastTap && now - lastTap.time < DOUBLE_TAP_WINDOW_MS && distanceBetween(lastTap, { x, y }) < DOUBLE_TAP_DISTANCE) {
      lastTapRef.current = null;
      if (scale > 1.01) {
        resetZoom();
      } else {
        setScale(DOUBLE_TAP_SCALE);
      }
      return;
    }

    lastTapRef.current = { time: now, x, y };
  }

  function handleRowTransitionEnd(event: ReactTransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== 'transform') {
      return;
    }
    const delta = gestureRef.current.pendingDelta;
    if (delta) {
      setIndex((current) => (current + delta + total) % total);
    }
    gestureRef.current.pendingDelta = 0;
    setDragX(0);
    setIsAnimating(false);
    resetZoom();
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(pointersRef.current.values());
    const gesture = gestureRef.current;

    if (points.length === 2 && points[0] && points[1]) {
      gesture.mode = 'pinch';
      gesture.startDistance = distanceBetween(points[0], points[1]);
      gesture.startScale = scale;
      gesture.startPan = pan;
      gesture.moved = true;
    } else if (points.length === 1) {
      gesture.mode = scale > 1.01 ? 'pan' : 'swipe';
      gesture.startX = event.clientX;
      gesture.startY = event.clientY;
      gesture.startTime = performance.now();
      gesture.startPan = pan;
      gesture.moved = false;
    }

    setIsAnimating(false);
    setIsGestureActive(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      return;
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(pointersRef.current.values());
    const gesture = gestureRef.current;

    if (gesture.mode === 'pinch' && points.length === 2 && points[0] && points[1]) {
      const distance = distanceBetween(points[0], points[1]);
      const ratio = gesture.startDistance ? distance / gesture.startDistance : 1;
      const nextScale = clamp(gesture.startScale * ratio, MIN_SCALE, MAX_SCALE);
      setScale(nextScale);
      setPan(clampPan(gesture.startPan, nextScale));
    } else if (gesture.mode === 'pan') {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (Math.abs(dx) > TAP_MOVE_TOLERANCE || Math.abs(dy) > TAP_MOVE_TOLERANCE) {
        gesture.moved = true;
      }
      setPan(clampPan({ x: gesture.startPan.x + dx, y: gesture.startPan.y + dy }, scale));
    } else if (gesture.mode === 'swipe') {
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (Math.abs(dx) > TAP_MOVE_TOLERANCE || Math.abs(dy) > TAP_MOVE_TOLERANCE) {
        gesture.moved = true;
      }
      setDragX(dx);
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      return;
    }
    pointersRef.current.delete(event.pointerId);
    const remaining = pointersRef.current.size;
    const gesture = gestureRef.current;
    const mode = gesture.mode;

    if (remaining > 0) {
      const point = Array.from(pointersRef.current.values())[0];
      if (mode === 'pinch' && point) {
        gesture.mode = 'pan';
        gesture.startX = point.x;
        gesture.startY = point.y;
        gesture.startPan = pan;
      }
      return;
    }

    if (mode === 'pinch' || mode === 'pan') {
      if (!gesture.moved) {
        handleTap(event.clientX, event.clientY);
      }
      if (scale <= 1.02) {
        resetZoom();
      }
    } else if (mode === 'swipe') {
      if (!gesture.moved) {
        handleTap(event.clientX, event.clientY);
        setIsAnimating(true);
        setDragX(0);
      } else {
        const elapsed = performance.now() - gesture.startTime;
        const velocity = Math.abs(dragX) / Math.max(elapsed, 1);
        const commitThreshold = window.innerWidth * SWIPE_COMMIT_RATIO;

        if (total > 1 && (dragX <= -commitThreshold || (dragX < 0 && velocity > SWIPE_COMMIT_VELOCITY))) {
          navigate(1);
        } else if (total > 1 && (dragX >= commitThreshold || (dragX > 0 && velocity > SWIPE_COMMIT_VELOCITY))) {
          navigate(-1);
        } else {
          setIsAnimating(true);
          setDragX(0);
        }
      }
    }

    gesture.mode = 'idle';
    setIsGestureActive(false);
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const nextScale = clamp(scale - event.deltaY * 0.0015, MIN_SCALE, MAX_SCALE);
    setScale(nextScale);
    setPan(nextScale <= 1 ? { x: 0, y: 0 } : clampPan(pan, nextScale));
  }

  const previewBody = (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white sm:px-6">
        <span className="text-sm font-medium text-white/70">{total > 1 ? `${index + 1}/${total}` : ''}</span>
        <button
          aria-label="Đóng"
          className="mt-1 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        className="relative flex-1 overflow-hidden"
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <div
          className="flex h-full w-[300%]"
          onTransitionEnd={handleRowTransitionEnd}
          style={{
            transform: `translateX(calc(-33.3333% + ${dragX}px))`,
            transition: isAnimating ? 'transform 280ms ease-out' : 'none',
          }}
        >
          <PhotoSlide item={items[prevIndex]!} />
          <PhotoSlide item={items[index]!} isCurrent pan={pan} scale={scale} transitionsEnabled={!isGestureActive} />
          <PhotoSlide item={items[nextIndex]!} />
        </div>
      </div>

      {total > 1 ? (
        <>
          <button
            aria-label="Ảnh trước"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:flex md:left-6"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            aria-label="Ảnh sau"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:flex md:right-6"
            onClick={() => navigate(1)}
            type="button"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      ) : null}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog.Root onOpenChange={(open) => !open && onClose()} open>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />
          <Dialog.Content className="fixed inset-0 z-50 focus:outline-none" onCloseAutoFocus={(event) => event.preventDefault()}>
            <Dialog.Title className="sr-only">Xem ảnh</Dialog.Title>
            <Dialog.Description className="sr-only">Xem trước ảnh đính kèm toàn màn hình</Dialog.Description>
            {previewBody}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root onOpenChange={(open) => !open && onClose()} open>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md" />
        <Drawer.Content className="fixed inset-0 z-50 focus:outline-none" onCloseAutoFocus={(event) => event.preventDefault()}>
          <Drawer.Title className="sr-only">Xem ảnh</Drawer.Title>
          <Drawer.Description className="sr-only">Xem trước ảnh đính kèm toàn màn hình</Drawer.Description>
          {previewBody}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

type PhotoSlideProps = {
  item: PhotoPreviewItem;
  isCurrent?: boolean;
  scale?: number;
  pan?: { x: number; y: number };
  transitionsEnabled?: boolean;
};

function PhotoSlide({ item, isCurrent = false, scale = 1, pan = { x: 0, y: 0 }, transitionsEnabled = true }: PhotoSlideProps) {
  return (
    <div className="flex h-full w-1/3 shrink-0 items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- external R2/user-provided URL rendered inside a plain lightbox, no next/image domain config */}
      <img
        alt={item.alt ?? ''}
        className="max-h-full max-w-full select-none object-contain"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        src={item.url}
        style={
          isCurrent
            ? {
                transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
                transition: transitionsEnabled ? 'transform 200ms ease-out' : 'none',
              }
            : undefined
        }
      />
    </div>
  );
}
