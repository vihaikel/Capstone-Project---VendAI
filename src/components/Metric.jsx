import React, { useMemo, useState } from 'react';

function Metric({ icon, color, label, value, trend, note }) {
  return (
    <div className='col-6 col-xl-3'>
      <div className='metric-card'>
        <div className='metric-top'>
          <div className={`metric-icon ${color}`}>
            <i className={`bi ${icon}`}></i>
          </div>
          <button className='icon-button subtle' aria-label='Info metrik'>
            <i className='bi bi-three-dots'></i>
          </button>
        </div>
        <div className='metric-label'>{label}</div>
        <div className='metric-value'>{value}</div>
        <div className='metric-foot'>
          <span className='trend'>{trend}</span>
          <span>{note}</span>
        </div>
      </div>
    </div>
  );
}

export default Metric;
