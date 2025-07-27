import { useState, useEffect } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string>('/lovable-uploads/a9647f0e-d57c-4573-a4f9-d5491fb9f5de.png');

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-pulse-blue to-pulse-cyan p-1 ${className}`}>
      <img 
        src={processedLogoUrl}
        alt="Coached" 
        className="w-full h-full object-cover rounded-full"
        style={{ 
          filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))',
          background: 'transparent'
        }}
      />
    </div>
  );
}