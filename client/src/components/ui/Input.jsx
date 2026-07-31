import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export const Input = forwardRef(function Input(
  { label, error, icon, className, id, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
        ) : null}
        <input
          ref={ref}
          id={id}
          className={cn('input-field', icon && 'pl-11', error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
          {...props}
        />
      </div>
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
});
