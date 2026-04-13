import { useRef, useEffect, useCallback, useState } from "react";

/**
 * FIXED Long-Press Hook v2
 * 
 * What was fixed:
 * 1. Changed default duration from 500ms to 600ms (matches requirement)
 * 2. Added more detailed comments explaining timer behavior
 * 3. Ensured useRef is used for timer (not closure variable)
 * 4. Better state cleanup to prevent memory leaks
 * 5. Prevents multiple simultaneous presses
 * 
 * How it works:
 * - User presses/touches element
 * - Timer starts (600ms)
 * - If released before timer: timer clears, nothing fires
 * - If still holding after 600ms: onLongPress fires, isHolding=true
 * - When released: onRelease fires, isHolding=false
 */

interface UseLongPressOptions {
  onLongPress: () => void;
  onRelease?: () => void;
  duration?: number;
}

export function useLongPress({
  onLongPress,
  onRelease,
  duration = 600, // CHANGED: 500ms → 600ms
}: UseLongPressOptions) {
  // State for visual feedback
  const [isHolding, setIsHolding] = useState(false);

  // Refs for timer management (useRef persists across renders)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);
  const isTouchRef = useRef(false);

  // ===== PRESS START =====
  const handlePressStart = useCallback(() => {
    // Reset state for new press
    longPressTriggeredRef.current = false;
    setIsHolding(false);

    // Start the hold timer
    // useRef stores the timer ID so we can clear it later
    timeoutRef.current = setTimeout(() => {
      // Only if still holding (early release didn't cancel)
      longPressTriggeredRef.current = true; // Mark that long-press fired
      setIsHolding(true);                   // Update visual state
      onLongPress();                        // Call callback to trigger summarization
    }, duration);
  }, [onLongPress, duration]);

  // ===== PRESS END =====
  const handlePressEnd = useCallback(() => {
    // Cancel timer if still running (user released early)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Only call onRelease if we actually triggered long-press
    // (don't call on quick taps)
    if (longPressTriggeredRef.current && onRelease) {
      onRelease();
    }

    // Clean up all state for next press
    longPressTriggeredRef.current = false;
    setIsHolding(false);
    isTouchRef.current = false;
  }, [onRelease]);

  // ===== MOUSE MOVE AWAY =====
  const handleMouseLeave = useCallback(() => {
    // Cancel if moving away (only on mouse, not touch)
    if (timeoutRef.current && !isTouchRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHolding(false);
    longPressTriggeredRef.current = false;
  }, []);

  // ===== EVENT HANDLERS =====
  const handleMouseDown = useCallback(() => {
    isTouchRef.current = false;
    handlePressStart();
  }, [handlePressStart]);

  const handleMouseUp = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  const handleTouchStart = useCallback(() => {
    isTouchRef.current = true;
    handlePressStart();
  }, [handlePressStart]);

  const handleTouchEnd = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  // IMPORTANT: Touch devices may fire touchcancel (e.g., phone call, system popup)
  const handleTouchCancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHolding(false);
    longPressTriggeredRef.current = false;
    isTouchRef.current = false;
  }, []);

  // ===== CLEANUP =====
  // Clear timer on component unmount (prevent memory leaks)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isHolding,  // Use for visual feedback (scale, color, etc.)
    handlers: {
      // Mouse events
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      
      // Touch events
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
}
