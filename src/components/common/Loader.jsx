import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', color = 'primary' }) => {
  return (
    <div className={`loader loader--${size} loader--${color}`}>
      <div className="loader__spinner"></div>
    </div>
  );
};

export default Loader;
