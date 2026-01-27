import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      
      {/* Large Rectangular Logo Container */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '350px', // Increased width for a "Big" feel
          height: '200px', // Rectangular height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)', // Subtle glassmorphism
          backdropFilter: 'blur(8px)',
          borderBottomLeftRadius: '24px', // Rounded corner for a modern look
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <img 
          src="/logo/image.png" 
          alt="Logo" 
          style={{
            width: '85%', // Scaled relative to the container
            height: '85%',
            objectFit: 'contain',
            opacity: 0.9,
            // Subtle filter to make it pop against your doodle background
            filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.1))' 
          }}
        />
      </div>
      
      {/* Footer Credits */}
      <div 
        style={{
          position: 'fixed',
          bottom: 24, // Slightly more padding from the bottom
          left: '50%',
          transform: 'translateX(-50%)', // Perfectly centers the element
          fontSize: '16px', // Increased size for better readability
          fontWeight: 600, // Slightly bolder to match the "bigger" feel
          color: 'var(--text-muted)',
          zIndex: 50,
          pointerEvents: 'none',
          opacity: 0.8, // Increased opacity so it doesn't fade into the background too much
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.5px' // Adds a touch of "premium" look
        }}
      >
        Made by Rimuru
      </div>
    </div>  
  );
};