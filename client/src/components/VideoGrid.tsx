import React from 'react';

export interface VideoGridProps {
  children: React.ReactNode;
  participantCount: number;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ children, participantCount }) => {
  // Determine layout classes based on participant count
  let gridClass = '';
  
  if (participantCount === 1) {
    gridClass = 'grid-cols-1 grid-rows-1';
  } else if (participantCount === 2) {
    gridClass = 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1';
  } else if (participantCount >= 3 && participantCount <= 4) {
    gridClass = 'grid-cols-2 grid-rows-2';
  } else if (participantCount >= 5 && participantCount <= 6) {
    gridClass = 'grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2';
  } else if (participantCount >= 7 && participantCount <= 9) {
    gridClass = 'grid-cols-3 grid-rows-3';
  } else {
    // 10+ participants
    gridClass = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 auto-rows-fr';
  }

  return (
    <div className="w-full h-full p-2 md:p-4 bg-surface flex items-center justify-center overflow-hidden">
      <div className={`w-full h-full grid gap-2 md:gap-3 ${gridClass}`}>
        {children}
      </div>
    </div>
  );
};
