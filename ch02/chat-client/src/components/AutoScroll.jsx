import React from 'react';
import { useEffect } from 'react';
import useIsAtBottom from '@/hooks/use-is-at-bottom';
import { useInView } from 'react-intersection-observer';

const AutoScroll = ({ trackVisibility }) => {
  const isAtBottom = useIsAtBottom();
  const { ref, entry, inView } = useInView({
    trackVisibility,
    delay: 100,
    rootMargin: '0px 0px -50px 0px',
  });
  useEffect(() => {
    if (isAtBottom && trackVisibility && !inView) {
      entry?.target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [inView, entry, isAtBottom, trackVisibility]);

  return <div ref={ref} className="h-px w-full" />;
};

export default AutoScroll;
