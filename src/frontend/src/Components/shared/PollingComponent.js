import React, { useEffect } from 'react';

export default function PollingComponent(props) {
  /* Setup */
  // Props
  const { interval, runnable, runImmediately=false } = props;

  // Effects
  useEffect(() => {
    let intervalId;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        intervalId = setInterval(() => {
          runnable();
        }, interval);
      }
    };

    // Set up initial timeout to delay the first execution
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        runnable();
      }, interval);
    }, interval);

    if (runImmediately) {
      setTimeout(runnable, 0);
    }

    // Add visibility change event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up intervals, timeout, and event listener on component unmount
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /* Rendering */
  // Main component
  return (
    <></>
  );
}
