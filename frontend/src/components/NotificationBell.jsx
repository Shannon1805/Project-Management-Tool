import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Connect to backend Socket.IO
const socket = io('http://localhost:9000'); // your backend port

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    socket.on('notification', (msg) => {
      setNotifications(prev => [msg, ...prev]); // newest on top
    });

    return () => socket.off('notification');
  }, []);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        className="text-2xl relative" 
        onClick={() => setOpen(!open)}
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && notifications.length > 0 && (
        <div className="absolute right-0 mt-2 w-72 bg-white border shadow-lg rounded z-50">
          {notifications.map((note, idx) => (
            <div key={idx} className="p-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer">
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
