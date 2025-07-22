import * as React from 'react';
import { Button as MUIButton } from '@mui/material';
import type { ButtonProps as MUIButtonProps } from '@mui/material';

type VariantType =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'outlined';

interface ButtonProps extends Omit<MUIButtonProps, 'color' | 'variant'> {
  variantType?: VariantType;
  children: React.ReactNode;
}

const variantToColorMap: Record<VariantType, 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
  outlined: 'primary', 
};

const Button: React.FC<ButtonProps> = (props: ButtonProps) => {
  const { variantType = 'primary', children, ...rest } = props;
  const isOutlined = variantType === 'outlined';

  return (
    <MUIButton
      variant={isOutlined ? 'outlined' : 'contained'}
      color={variantToColorMap[variantType]}
      {...rest}
    >
      {children}
      </MUIButton>
    );
  };
  
  export default Button;
