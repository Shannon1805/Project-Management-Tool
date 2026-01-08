import React from 'react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-4 bg-white shadow h-14">
      <h1 className="font-bold text-xl">TaskNest</h1>
      <NotificationBell />
    </nav>
  );
};

export default Navbar;
