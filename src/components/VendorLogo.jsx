import React, { useMemo, useState } from 'react';

function VendorLogo({ vendor }) {
  return (
    <div className={`vendor-logo ${vendor.color}`}>
      <span>{vendor.initials}</span>
      <i className='bi bi-circle-fill'></i>
    </div>
  );
}

export default VendorLogo;
