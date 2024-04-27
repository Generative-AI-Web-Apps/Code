'use client';
import { useRef } from 'react';

function useEnterSubmit() {
  const formRef = useRef(null);
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      formRef.current?.requestSubmit();
      event.preventDefault();
    }
  };

  return { formRef, onKeyDown: handleKeyDown };
}

export default useEnterSubmit;
