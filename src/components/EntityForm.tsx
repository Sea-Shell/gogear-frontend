import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';

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

  const labelPrefix = title ? title.replace(/\s+/g, '-') : 'field';

  const handleChange = (field: FieldConfig<T>) => (event: ValueChangeEvent) => {
    const value = extractFieldValue(field, event);
    setValues((prev: Partial<T>) => ({ ...prev, [field.name as keyof T]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('pending');
    setError(null);

    try {
      await onSubmit(values);
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(submissionError instanceof Error ? submissionError.message : 'Unexpected error');
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="form-grid">
      {fields.map((field) => {
        const inputId = `${labelPrefix}-${String(field.name)}`;
        return (
          <div className="field" key={field.name}>
            <label htmlFor={inputId}>{field.label}</label>
            {renderInput(field, values[field.name as keyof T], handleChange(field), inputId)}
            {field.description && <small style={{ color: '#475569' }}>{field.description}</small>}
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
  id: string
) => {
  if (field.type === 'textarea') {
    return (
      <textarea
        id={id}
        placeholder={field.placeholder}
        required={field.required}
        onChange={onChange}
        value={(value as string | undefined) ?? ''}
      />
    );
  }

  if (field.type === 'boolean') {
    return (
      <select id={id} value={value === true ? 'true' : value === false ? 'false' : ''} onChange={onChange}>
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
        value={
          typeof value === 'string'
            ? value
            : value === undefined || value === null
              ? ''
              : String(value)
        }
        onChange={onChange}
        required={field.required}
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
      type={field.type === 'number' ? 'number' : 'text'}
      placeholder={field.placeholder}
      required={field.required}
      min={field.min}
      max={field.max}
      value={value === undefined || value === null ? '' : String(value)}
      onChange={onChange}
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
