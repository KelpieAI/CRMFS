import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function DateInput({
  value,
  onChange,
  label,
  required = false,
  className = '',
  placeholder = 'DD/MM/YYYY',
}: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLInputElement>(null);

  // Convert ISO date (YYYY-MM-DD) to display format (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      setDisplayValue(`${day}/${month}/${year}`);
    } else {
      setDisplayValue('');
    }
  }, [value]);

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
      onChange(isoDate);
    } else if (input === '') {
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
    onChange(e.target.value);
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
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 0, height: 0 }}
        />
      </div>
    </div>
  );
}