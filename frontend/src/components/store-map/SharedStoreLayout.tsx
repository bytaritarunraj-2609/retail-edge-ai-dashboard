import React from 'react';
import { Shelf } from '../../types';

interface SharedStoreLayoutProps {
  shelves: Shelf[];
  renderShelf: (shelf: Shelf) => React.ReactNode;
  overlay?: React.ReactNode;
}

export function SharedStoreLayout({ shelves, renderShelf, overlay }: SharedStoreLayoutProps) {
  // Aisle A: 1-10
  const aisleA = shelves.slice(0, 10);
  // Aisle B: 11-20
  const aisleB = shelves.slice(10, 20);

  return (
    <div className="store-map-container" style={{ position: 'relative' }}>
      {overlay}
      <div className="aisle aisle-a">
        <div className="aisle-label">AISLE A</div>
        <div className="shelf-grid">
          {aisleA.map(shelf => (
            <React.Fragment key={shelf.id}>
              {renderShelf(shelf)}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <div className="aisle aisle-b">
        <div className="aisle-label">AISLE B</div>
        <div className="shelf-grid">
          {aisleB.map(shelf => (
            <React.Fragment key={shelf.id}>
              {renderShelf(shelf)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
