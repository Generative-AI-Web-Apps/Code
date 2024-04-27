'use client';
import { useEffect, useRef } from 'react';

function useFocusOnSlashPress() {
  const inputRef = useRef(null);
  useEffect(() => {
    const handleSlashKeyDown = (e) => {
      if (e.key === '/' && !isInputElement(e.target)) {
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleSlashKeyDown);

    return () => document.removeEventListener('keydown', handleSlashKeyDown);
  }, []);

  // Helper function to check if element is an input or textarea
  function isInputElement(element) {
    return ['INPUT', 'TEXTAREA'].includes(element.nodeName);
  }
  return inputRef;
}

export default useFocusOnSlashPress;
