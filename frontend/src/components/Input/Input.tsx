import React from 'react';

interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  required?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  label,
  required = false,
  onKeyPress,
}) => {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <input
        type={type}
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        required={required}
      />
    </div>
  );
};

