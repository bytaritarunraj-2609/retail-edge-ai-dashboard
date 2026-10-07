import React from 'react';
import { Glass } from '../ui/Glass';
import { Camera } from '../../types';

interface CameraResourceSummaryProps {
  activeCameraIds: number[];
  nextCameraIds: number[];
  totalCameras: number;
}

export function CameraResourceSummary({
  activeCameraIds,
  nextCameraIds,
  totalCameras,
}: CameraResourceSummaryProps) {
  return (
    <Glass className="camera-resource-summary">
      <div className="summary-header">
        <span className="count-pill">
          <i className="live-dot" />
          {activeCameraIds.length} / {totalCameras} CAMERAS ACTIVE
        </span>
      </div>
      
      <div className="summary-body">
        <div className="camera-group">
          <small>CURRENT (ACTIVE)</small>
          <div className="camera-badges">
            {activeCameraIds.map(id => (
              <span key={id} className="cam-badge active">
                Cam {String(id).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
        
        <div className="camera-group">
          <small>NEXT (PRIORITY)</small>
          <div className="camera-badges">
            {nextCameraIds.map(id => (
              <span key={id} className="cam-badge queued">
                Cam {String(id).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Glass>
  );
}
