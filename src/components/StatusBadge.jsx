import React, { useMemo, useState } from 'react';

function StatusBadge({ status }) {
  const cls =
    status === 'Selesai'
      ? 'done'
      : status === 'Dalam proses'
        ? 'progressing'
        : 'pending';
  return (
    <span className={`status-badge ${cls}`}>
      <span></span>
      {status}
    </span>
  );
}

export default StatusBadge;
