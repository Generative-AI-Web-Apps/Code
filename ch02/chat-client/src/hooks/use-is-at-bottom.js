import * as React from 'react';

function useIsAtBottom(offset = 0) {
  const [isAtBottom, setIsAtBottom] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsAtBottom(window.innerHeight + window.scrollY >= document.body.offsetHeight - offset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [offset]);

  return isAtBottom;
}

export default useIsAtBottom;
