import React from 'react';
import { Navigate } from 'react-router-dom';

// Rankings have been merged into the Colleges page.
// Keep this route alive so old bookmarks/links still work.
export function Rankings() {
  return <Navigate to="/colleges" replace />;
}
