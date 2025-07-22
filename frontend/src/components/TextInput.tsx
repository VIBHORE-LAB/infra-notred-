import * as React from 'react';
import { TextField } from '@mui/material';
import * as PropTypes from 'prop-types';

import type { TextFieldVariants } from '@mui/material/TextField';

interface TextInputProps {
  label: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  name: string;
  type?: string;
  variant?: TextFieldVariants;
  placeholder?: string;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  [key: string]: unknown;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  name,
  type = 'text',
  variant = 'outlined',
  placeholder = '',
  fullWidth = true,
  error = false,
  helperText = '',
  ...rest
}) => {
  return (
    <TextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      variant={variant}
      placeholder={placeholder}
      fullWidth={fullWidth}
      error={error}
      helperText={helperText}
      {...rest}
    />
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
