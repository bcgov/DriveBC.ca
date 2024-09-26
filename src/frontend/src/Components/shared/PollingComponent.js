// React
import React, { useEffect } from 'react';

export default function PollingComponent(props) {
  /* Setup */
  // Props
  const { interval, runnable } = props;

  // Effects
  useEffect(() => {
    // Set up reoccuring calls with interval
    const intervalId = setInterval(() => {
      runnable();
    }, interval);

    // Clean up intervals on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  /* Rendering */
  // Main component
  return (
    <></>
  );
}
