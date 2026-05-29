import React, { useState, useRef, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface DateInputProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  minDate?: string; // ISO date string (YYYY-MM-DD)
  maxDate?: string; // ISO date string (YYYY-MM-DD)
  errorMessage?: string;
}

export default function DateInput({
  value,
  onChange,
  label,
  required = false,
  className = '',
  placeholder = 'DD/MM/YYYY',
  minDate,
  maxDate,
  errorMessage,
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLInputElement>(null);

  console.log(showCalendar);

  // Convert ISO date (YYYY-MM-DD) to display format (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      setDisplayValue(`${day}/${month}/${year}`);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Validate date against min/max
  const validateDate = (isoDate: string): boolean => {
    if (!isoDate) return true; // Empty is valid (unless required, which HTML handles)

    const date = new Date(isoDate);
    
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) {
        setError(errorMessage || `Date must be after ${formatDisplayDate(minDate)}`);
        return false;
      }
    }
    
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) {
        setError(errorMessage || `Date must be before ${formatDisplayDate(maxDate)}`);
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const formatDisplayDate = (isoDate: string): string => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert display format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
  const convertToISO = (dateStr: string): string => {
    // Remove any non-digit characters
    const digits = dateStr.replace(/\D/g, '');
    
    if (digits.length === 8) {
      const day = digits.substring(0, 2);
      const month = digits.substring(2, 4);
      const year = digits.substring(4, 8);
      
      // Basic validation
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (
        dayNum >= 1 && dayNum <= 31 &&
        monthNum >= 1 && monthNum <= 12 &&
        yearNum >= 1900 && yearNum <= 2100
      ) {
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Allow only digits and slashes
    input = input.replace(/[^\d/]/g, '');
    
    // Auto-add slashes as user types
    if (input.length === 2 && !input.includes('/')) {
      input = input + '/';
    } else if (input.length === 5 && input.split('/').length === 2) {
      input = input + '/';
    }
    
    // Limit to DD/MM/YYYY format
    if (input.length > 10) {
      input = input.substring(0, 10);
    }
    
    setDisplayValue(input);
    
    // Try to convert to ISO and update parent if valid
    const isoDate = convertToISO(input);
    if (isoDate) {
      if (validateDate(isoDate)) {
        onChange(isoDate);
      } else {
        // Still update to trigger validation in parent, but show error
        onChange(isoDate);
      }
    } else if (input === '') {
      setError('');
      onChange('');
    }
  };

  const handleFocus = () => {
    // Select all text when field is focused
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    if (validateDate(isoDate)) {
      onChange(isoDate);
    } else {
      onChange(isoDate); // Still update to show error
    }
    setShowCalendar(false);
  };

  const handleCalendarClick = () => {
    setShowCalendar(true);
    setTimeout(() => {
      calendarRef.current?.showPicker?.();
    }, 0);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 bg-red-50'
              : 'border-gray-300 focus:border-emerald-500'
          }`}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <Calendar className="h-5 w-5" />
        </button>
        {/* Hidden native date input for calendar picker */}
        <input
          ref={calendarRef}
          type="date"
          value={value}
          onChange={handleCalendarChange}
          min={minDate}
          max={maxDate}
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 0, height: 0 }}
        />
      </div>
      {error && (
        <div className="mt-2 flex items-start text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}