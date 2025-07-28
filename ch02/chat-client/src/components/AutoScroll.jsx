// src/components/AutoScroll.jsx
import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

/**
 * A scrollable container component that provides auto-scrolling capabilities
 * and tracks if the user is at the bottom.
 * It exposes a `scrollToBottom` method via `ref`.
 */
const AutoScroll = forwardRef(({ children, onScrollStatusChange }, ref) => {
  const scrollableRef = useRef(null);
  // State to track if the user is currently at the bottom of the scroll area
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Expose a `scrollToBottom` method to the parent component via ref.
  useImperativeHandle(ref, () => ({
    /**
     * Imperatively scrolls the container to its bottom.
     */
    scrollToBottom: () => {
      if (scrollableRef.current) {
        scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
      }
    },
    /**
     * Returns the current `isAtBottom` status.
     * @returns {boolean} True if the user is at or near the bottom, false otherwise.
     */
    getIsAtBottom: () => isAtBottom,
  }));

  /**
   * Handles scroll events to update the `isAtBottom` state.
   * Uses a small buffer (10px) to consider "near bottom" as "at bottom".
   */
  const handleScroll = useCallback(() => {
    if (scrollableRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableRef.current;
      // Check if user is at or very near the bottom
      const atBottom = scrollHeight - scrollTop <= clientHeight + 10;
      if (atBottom !== isAtBottom) {
        setIsAtBottom(atBottom);
        // Inform the parent component about the scroll status change
        if (onScrollStatusChange) {
          onScrollStatusChange(atBottom);
        }
      }
    }
  }, [isAtBottom, onScrollStatusChange]);

  // Attach and detach scroll event listener
  useEffect(() => {
    const scrollElement = scrollableRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // Perform an initial check on mount to set the correct state
      handleScroll();
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Effect to auto-scroll when children (messages) change, but only if the user was already at the bottom.
  // This prevents disrupting the user if they've scrolled up to read old messages.
  useEffect(() => {
    if (isAtBottom && scrollableRef.current) {
      scrollableRef.current.scrollTop = scrollableRef.current.scrollHeight;
    }
  }, [children, isAtBottom]); // `children` here typically represents the messages list changing

  return (
    // The div itself needs to be scrollable
    <div
      ref={scrollableRef}
      className="overflow-y-auto flex-grow flex flex-col h-full" // Make it vertically scrollable and fill available height
      style={{ minHeight: '0' }} // Ensures it can shrink if content is small
    >
      {children}
    </div>
  );
});

export default AutoScroll;