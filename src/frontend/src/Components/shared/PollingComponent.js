import React, { useEffect, useRef } from 'react';

export default function PollingComponent(props) {
  /* Setup */
  // Props
  const { interval, runnable, runImmediately=false } = props;

  // Always call the latest runnable (avoid stale closure from mount-only effect)
  const runnableRef = useRef(runnable);
  runnableRef.current = runnable;

  // Effects
  useEffect(() => {
    let intervalId;

    const tick = () => {
      runnableRef.current();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        intervalId = setInterval(tick, interval);
      }
    };

    // Set up initial timeout to delay the first execution
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(tick, interval);
    }, interval);

    if (runImmediately) {
      setTimeout(tick, 0);
    }

    // Add visibility change event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up intervals, timeout, and event listener on component unmount
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);

  /* Rendering */
  // Main component
  return (
    <></>
  );
}
