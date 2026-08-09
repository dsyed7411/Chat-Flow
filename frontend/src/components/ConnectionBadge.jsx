import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export const ConnectionBadge = ({ status }) => {
  if (status === 'connected') {
    return (
      <div className="connection-badge" title="Real-time Socket.io connected">
        <Wifi size={14} />
        <span>Connected</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="connection-badge connecting" title="Reconnecting to Socket.io server">
        <Loader2 size={14} className="animate-spin" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="connection-badge offline" title="Socket.io server disconnected">
      <WifiOff size={14} />
      <span>Offline</span>
    </div>
  );
};
