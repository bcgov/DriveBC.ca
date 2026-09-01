// React
import React, { useEffect, useState } from 'react';

// External imports
import { Drawer } from '@vladyoslav/drawer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

// Internal imports
import AdvisoriesPanel from '../map/panels/AdvisoriesPanel';

// Styling
import './AdvisoriesOverlay.scss';

export default function AdvisoriesOverlay(props) {
  const { open, onClose, advisories } = props;

  const snapPoints = ['20%', '50%', '100%'];
  const [snap, setSnap] = useState('50%');
  const [drawerContainer, setDrawerContainer] = useState(null);

  useEffect(() => {
    if (!open) {
      setSnap('50%');
    }
  }, [open]);

  return (
    <React.Fragment>
      <div
        className="advisories-drawer-container"
        ref={setDrawerContainer}
        data-vladyoslav-drawer-wrapper="" />

      {open && drawerContainer &&
        <Drawer.Root
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              onClose();
            }
          }}
          snapPoints={snapPoints}
          snap={snap}
          setSnap={setSnap}
          modal={false}
          dismissible={true}
          shouldScaleBackground={false}
          scaleFrom={'50%'}>

          <Drawer.Portal container={drawerContainer}>
            <Drawer.Overlay
              className="advisories-drawer-overlay"
              radixPrimitive={false}
              blockInteraction={true}
            />
            <Drawer.Content
              className="advisories-drawer"
              style={{ '--drawer-snap-point': snap }}>

              <div
                className="overlay advisories-overlay open"
                onPointerDown={(e) => {
                  // Let advisory list scroll without dragging the drawer
                  if (e.target.closest('.popup__content')) {
                    e.stopPropagation();
                  }
                }}>
                <div className="drawer-drag-handle"></div>

                <button
                  className="close-panel close-overlay"
                  aria-label="close overlay"
                  onClick={onClose}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>

                <AdvisoriesPanel
                  advisories={advisories}
                  openAdvisoriesOverlay={open}
                />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      }
    </React.Fragment>
  );
}
