import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = ''
}) => {
  const [visible, setVisible] = useState(false);

  let positionClasses = 'bottom-full left-1/2 -translate-x-1/2 mb-2';
  if (position === 'bottom') positionClasses = 'top-full left-1/2 -translate-x-1/2 mt-2';
  if (position === 'left') positionClasses = 'right-full top-1/2 -translate-y-1/2 mr-2';
  if (position === 'right') positionClasses = 'left-full top-1/2 -translate-y-1/2 ml-2';

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute z-[99999] px-2.5 py-1.5 text-[11px] font-medium text-white bg-slate-900 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150 ${positionClasses}`}>
          {content}
          <div className="absolute w-2 h-2 bg-slate-900 rotate-45 left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}
    </div>
  );
};
