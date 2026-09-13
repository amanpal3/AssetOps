import React from 'react';
import { VersionBadge } from './VersionBadge.js';

export const ActionFeed: React.FC = () => {
  return (
    <div className="bg-surface p-4 rounded-xl border border-line">
      <h3 className="font-semibold text-ink">Corporate Action Feed</h3>
      <div className="mt-2">
        <VersionBadge version={1} status="ACTIVE" />
      </div>
    </div>
  );
};
