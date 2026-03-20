import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type SharedChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

interface TextInputProps {
  label: string;
  value: string | number;
  onChange: (event: SharedChangeEvent) => void;
  name: string;
  type?: string;
  variant?: 'outlined' | 'filled' | 'standard';
  placeholder?: string;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  multiline?: boolean;
  minRows?: number;
  select?: boolean;
  children?: React.ReactNode;
  InputLabelProps?: {
    shrink?: boolean;
  };
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  name,
  type = 'text',
  variant: _variant = 'outlined',
  placeholder = '',
  fullWidth = true,
  error = false,
  helperText = '',
  multiline = false,
  minRows = 3,
  select = false,
  children,
  InputLabelProps: _inputLabelProps,
  inputProps,
  className,
  required = false,
  disabled = false,
  ...rest
}) => {
  const controlClassName = cn(fullWidth && 'w-full');

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full', className)}>
      <Label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}
      </Label>

      {select ? (
        <NativeSelect
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={controlClassName}
          required={required}
          disabled={disabled}
          {...rest}
        >
          {children}
        </NativeSelect>
      ) : multiline ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn('rounded-xl', controlClassName)}
          rows={minRows}
          required={required}
          disabled={disabled}
          {...rest}
        />
      ) : (
        <Input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className={cn('h-11 rounded-xl', controlClassName)}
          required={required}
          disabled={disabled}
          {...inputProps}
          {...rest}
        />
      )}

      {helperText ? (
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

TextInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
};

export default TextInput;
