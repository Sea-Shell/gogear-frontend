import { ChangeEvent, FormEvent, ReactNode, useCallback, useState } from 'react';

export type FieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'select';

export interface FieldConfig<T extends object> {
  name: Extract<keyof T, string>;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: string }>;
  /** Custom validation. Return an error string or undefined if valid. */
  validate?: (value: unknown, allValues: Partial<T>) => string | undefined;
}

interface EntityFormProps<T extends object> {
  title?: string;
  fields: FieldConfig<T>[];
  initialValues?: Partial<T>;
  submitLabel?: string;
  onSubmit: (values: Partial<T>) => Promise<void>;
  footer?: ReactNode;
  variant?: 'card' | 'inline';
  className?: string;
}

type ValueChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

export function EntityForm<T extends object>({
  title,
  fields,
  initialValues,
  submitLabel = 'Submit',
  onSubmit,
  footer,
  variant = 'card',
  className
}: EntityFormProps<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues ?? {});
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const labelPrefix = title ? title.replace(/\s+/g, '-') : 'field';

  const validateField = useCallback(
    (field: FieldConfig<T>): string | undefined => {
      const value = values[field.name as keyof T];

      if (field.required && (value === undefined || value === null || value === '')) {
        return `${field.label} is required`;
      }

      if (field.validate) {
        return field.validate(value, values);
      }

      return undefined;
    },
    [values]
  );

  const validateAllFields = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    for (const field of fields) {
      const errorMsg = validateField(field);
      if (errorMsg) {
        errors[String(field.name)] = errorMsg;
      }
    }
    return errors;
  }, [fields, validateField]);

  const handleChange = (field: FieldConfig<T>) => (event: ValueChangeEvent) => {
    const value = extractFieldValue(field, event);
    setValues((prev: Partial<T>) => ({ ...prev, [field.name as keyof T]: value }));

    // Clear the validation error for this field on change
    setValidationErrors((prev) => {
      if (!prev[String(field.name)]) return prev;
      const next = { ...prev };
      delete next[String(field.name)];
      return next;
    });
  };

  const handleBlur = (field: FieldConfig<T>) => () => {
    setTouchedFields((prev) => {
      const next = new Set(prev);
      next.add(String(field.name));
      return next;
    });

    const errorMsg = validateField(field);
    setValidationErrors((prev) => {
      if (errorMsg) {
        return { ...prev, [String(field.name)]: errorMsg };
      }
      if (!prev[String(field.name)]) return prev;
      const next = { ...prev };
      delete next[String(field.name)];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    // Mark all fields as touched
    const allTouched = new Set(fields.map((f) => String(f.name)));
    setTouchedFields(allTouched);

    // Validate all fields
    const errors = validateAllFields();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setStatus('pending');

    try {
      await onSubmit(values);
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error');
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="form-grid" noValidate>
      {fields.map((field) => {
        const fieldName = String(field.name);
        const inputId = `${labelPrefix}-${fieldName}`;
        const hasError = touchedFields.has(fieldName) && Boolean(validationErrors[fieldName]);
        return (
          <div className="field" key={fieldName}>
            <label htmlFor={inputId}>{field.label}</label>
            {renderInput(field, values[field.name as keyof T], handleChange(field), handleBlur(field), inputId, hasError)}
            {field.description && !hasError && <small className="field-hint">{field.description}</small>}
            {hasError && <small className="field-error">{validationErrors[fieldName]}</small>}
          </div>
        );
      })}
      <div className="form-actions">
        <button className="button" type="submit" disabled={status === 'pending'}>
          {status === 'pending' ? 'Working…' : submitLabel}
        </button>
        {footer}
      </div>
      {status === 'success' && <div className="notice">Action completed successfully.</div>}
      {status === 'error' && error && <div className="notice notice-error">{error}</div>}
    </form>
  );

  if (variant === 'inline') {
    return (
      <div className={className ?? 'action-form-inline'}>
        {title && <h4 className="entity-form-title">{title}</h4>}
        {form}
      </div>
    );
  }

  return (
    <section className={className ?? 'section'}>
      {title && <h3>{title}</h3>}
      {form}
    </section>
  );
}

const renderInput = <T extends object>(
  field: FieldConfig<T>,
  value: unknown,
  onChange: (event: ValueChangeEvent) => void,
  onBlur: () => void,
  id: string,
  hasError?: boolean
) => {
  const inputClass = hasError ? 'input-error' : undefined;

  if (field.type === 'textarea') {
    return (
      <textarea
        id={id}
        className={inputClass}
        placeholder={field.placeholder}
        required={field.required}
        onChange={onChange}
        onBlur={onBlur}
        value={(value as string | undefined) ?? ''}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <select
        id={id}
        className={inputClass}
        required={field.required}
        onChange={onChange}
        onBlur={onBlur}
        value={value === true ? 'true' : value === false ? 'false' : ''}
      >
        <option value="">Select…</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (field.type === 'select') {
    return (
      <select
        id={id}
        className={inputClass}
        required={field.required}
        onChange={onChange}
        onBlur={onBlur}
        value={
          typeof value === 'string'
            ? value
            : value === undefined || value === null
              ? ''
              : String(value)
        }
      >
        <option value="">Select…</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={id}
      className={inputClass}
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder}
      required={field.required}
      min={field.min}
      max={field.max}
      onChange={onChange}
      onBlur={onBlur}
      value={value === undefined || value === null ? '' : String(value)}
    />
  );
};

function extractFieldValue<T extends object>(
  field: FieldConfig<T>,
  event: ValueChangeEvent
): string | number | boolean | undefined {
  if (field.type === 'number') {
    const parsed = Number(event.target.value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (field.type === 'boolean') {
    if (event.target.value === 'true') return true;
    if (event.target.value === 'false') return false;
    return undefined;
  }

  return event.target.value || undefined;
}
