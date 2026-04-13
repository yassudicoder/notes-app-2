import { useRef, useEffect, useCallback } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onRelease?: () => void;
  duration?: number;
}

/**
 * Custom hook for detecting long press/hold interactions
 * Perfect for touch and mouse interactions
 */
export function useLongPress({
  onLongPress,
  onRelease,
  duration = 500,
}: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleMouseDown = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, duration);
  }, [onLongPress, duration]);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isLongPressRef.current && onRelease) {
      onRelease();
    }
    isLongPressRef.current = false;
  }, [onRelease]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isLongPressRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleMouseDown,
    onTouchEnd: handleMouseUp,
  };
}
