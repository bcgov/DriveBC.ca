// React
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// External imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';

// Styling
import './SelectedFiltersOverflow.scss';

const GAP = 8;

export default function SelectedFiltersOverflow({ children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const containerRef = useRef(null);
  const measureRef = useRef(null);
  const moreMeasureRef = useRef(null);
  const dropdownRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [open, setOpen] = useState(false);

  const itemKeys = items.map((item) => item.key).join('|');

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure || items.length === 0) {
      setVisibleCount(0);
      return;
    }

    const available = container.clientWidth;
    const pillEls = Array.from(
      measure.querySelectorAll('.selected-filter:not(.selected-filters-more)')
    );
    const widths = pillEls.map((el) => el.getBoundingClientRect().width);
    const moreWidth = moreMeasureRef.current?.getBoundingClientRect().width ?? 96;

    // Fit all without a more button when possible
    let total = 0;
    for (let i = 0; i < widths.length; i++) {
      total += widths[i] + (i > 0 ? GAP : 0);
    }
    if (total <= available) {
      setVisibleCount(widths.length);
      return;
    }

    // Find the largest number of leading pills that fit with a more button
    for (let count = widths.length - 1; count >= 0; count--) {
      let used = 0;
      for (let i = 0; i < count; i++) {
        used += widths[i] + (i > 0 ? GAP : 0);
      }
      used += (count > 0 ? GAP : 0) + moreWidth;
      if (used <= available) {
        setVisibleCount(count);
        return;
      }
    }

    setVisibleCount(0);
  }, [items.length]);

  useLayoutEffect(() => {
    recalculate();
  }, [recalculate, itemKeys]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => recalculate());
    observer.observe(container);
    return () => observer.disconnect();
  }, [recalculate]);

  useEffect(() => {
    setOpen(false);
  }, [items.length]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (items.length === 0) {
    return null;
  }

  const overflowCount = Math.max(items.length - visibleCount, 0);
  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);

  return (
    <div className="selected-filters-container" ref={containerRef}>
      <div className="selected-filters-measure" aria-hidden="true" ref={measureRef}>
        {items.map((item, index) =>
          React.cloneElement(item, { key: `measure-${item.key ?? index}` })
        )}
        <div className="selected-filter selected-filters-more" ref={moreMeasureRef}>
          <span className="selected-filter-text">+{items.length} more</span>
          <FontAwesomeIcon icon={faChevronDown} />
        </div>
      </div>

      {visibleItems}

      {overflowCount > 0 &&
        <div className="selected-filters-more-wrap" ref={dropdownRef}>
          <button
            type="button"
            className={'selected-filter selected-filters-more' + (open ? ' open' : '')}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={`${overflowCount} more selected filters`}
            onClick={() => setOpen((prev) => !prev)}>
            <span className="selected-filter-text">+{overflowCount} more</span>
            <FontAwesomeIcon icon={faChevronDown} />
          </button>

          {open &&
            <div className="selected-filters-dropdown" role="listbox">
              <div className="selected-filters-dropdown__header">
                {overflowCount} more filter{overflowCount === 1 ? '' : 's'}
              </div>
              {overflowItems}
            </div>
          }
        </div>
      }
    </div>
  );
}
