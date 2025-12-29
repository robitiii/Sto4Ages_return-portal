import { Package } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-primary rounded-full p-2">
        <Package className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      <span className={`${sizes[size]} font-bold text-primary tracking-tight`}>
        STO<span className="text-accent-foreground/80">4</span>AGES
      </span>
    </div>
  );
}
