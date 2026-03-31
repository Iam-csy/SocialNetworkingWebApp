import React from 'react';

const Avatar = ({ name = '', size = 'md', className = '' }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`avatar avatar-${size} ${className}`} title={name}>
      {initials || '?'}
    </div>
  );
};

export default Avatar;
