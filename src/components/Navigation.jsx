// frontend/src/components/Navigation.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="bottom-navigation">
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </NavLink>

      <NavLink 
        to="/packs" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">📦</span>
        <span className="nav-label">Packs</span>
      </NavLink>

      <NavLink 
        to="/achievements" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">🏆</span>
        <span className="nav-label">Achievements</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
};

export default Navigation;