// React
import React, { useEffect } from 'react';

export default function PollingComponent(props) {
  /* Setup */
  // Props
  const { interval, runnable } = props;

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

    // Set up initial interval
    intervalId = setInterval(() => {
      runnable();
    }, interval);

    // Add visibility change event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up intervals and event listener on component unmount
    return () => {
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
