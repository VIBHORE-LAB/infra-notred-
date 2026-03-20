import * as React from 'react';
import { Button as ShadcnButton } from '@/components/ui/button';

type VariantType =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'outlined';

interface ButtonProps extends React.ComponentProps<typeof ShadcnButton> {
  variantType?: VariantType;
  children: React.ReactNode;
}

const variantMap: Record<VariantType, React.ComponentProps<typeof ShadcnButton>['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  success: 'secondary',
  error: 'destructive',
  info: 'secondary',
  warning: 'secondary',
  outlined: 'outline',
};

const Button: React.FC<ButtonProps> = ({
  variantType = 'primary',
  className,
  children,
  ...rest
}) => {
  return (
    <ShadcnButton
      variant={variantMap[variantType]}
      className={['rounded-xl', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </ShadcnButton>
  );
};

export default Button;
