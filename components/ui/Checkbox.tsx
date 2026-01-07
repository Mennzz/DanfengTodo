import React from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, onChange, disabled, className = '' }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        flex items-center justify-center
        w-5 h-5
        border-2 rounded
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${
          checked
            ? 'bg-blue-500 border-blue-500'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
        }
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-blue-400'
        }
        ${className}
      `}
    >
      {checked && (
        <svg
          className="w-3.5 h-3.5 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}
