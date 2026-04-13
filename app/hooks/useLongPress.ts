import { useRef, useEffect, useCallback, useState } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  onRelease?: () => void;
  duration?: number;
}

/**
 * Custom hook for detecting long press/hold interactions
 * Supports both mouse and touch events reliably
 * 
 * Returns handlers to attach to element + state for visual feedback
 * 
 * Usage:
 * const { isHolding, handlers } = useLongPress({
 *   onLongPress: () => console.log('held!'),
 *   duration: 500
 * });
 * 
 * <div {...handlers} className={isHolding ? 'scale-95' : ''}>
 */
export function useLongPress({
  onLongPress,
  onRelease,
  duration = 500,
}: UseLongPressOptions) {
  const [isHolding, setIsHolding] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);
  const isTouchRef = useRef(false);

  // Handle press down (mouse or touch)
  const handlePressStart = useCallback(() => {
    // Reset state
    longPressTriggeredRef.current = false;
    setIsHolding(false);

    // Start timer for long press
    timeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsHolding(true);
      onLongPress();
    }, duration);
  }, [onLongPress, duration]);

  // Handle press end (mouse or touch)
  const handlePressEnd = useCallback(() => {
    // Clear the timeout if still waiting
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only call release if we actually triggered long press
    if (longPressTriggeredRef.current && onRelease) {
      onRelease();
    }

    // Clean up state
    longPressTriggeredRef.current = false;
    setIsHolding(false);
    isTouchRef.current = false;
  }, [onRelease]);

  // Handle mouse leave (cancel if moving away)
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current && !isTouchRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHolding(false);
    longPressTriggeredRef.current = false;
  }, []);

  // Handle mouse down
  const handleMouseDown = useCallback(() => {
    isTouchRef.current = false;
    handlePressStart();
  }, [handlePressStart]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  // Handle touch start
  const handleTouchStart = useCallback(() => {
    isTouchRef.current = true;
    handlePressStart();
  }, [handlePressStart]);

  // Handle touch end or cancel
  const handleTouchEnd = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  // Handle touch cancel (user cancels interaction)
  const handleTouchCancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHolding(false);
    longPressTriggeredRef.current = false;
    isTouchRef.current = false;
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
    isHolding, // State to use for visual feedback
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
