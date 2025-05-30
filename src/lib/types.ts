
export type ElementType =
  | 'text'
  | 'number'
  | 'email'
  | 'textarea'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'table'; // Added 'table' type

export interface FormElementOption {
  id: string;
  value: string;
  label: string;
}

export interface BaseFormElement {
  id: string;
  type: ElementType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  helperText?: string;
}

export interface TextFormElement extends BaseFormElement {
  type: 'text';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumberFormElement extends BaseFormElement {
  type: 'number';
  min?: number;
  max?: number;
}

export interface EmailFormElement extends BaseFormElement {
  type: 'email';
}

export interface TextareaFormElement extends BaseFormElement {
  type: 'textarea';
  rows?: number;
  minLength?: number;
  maxLength?: number;
}

export interface OptionsFormElement extends BaseFormElement {
  type: 'dropdown' | 'radio';
  options: FormElementOption[];
}

export interface CheckboxFormElement extends BaseFormElement {
  type: 'checkbox';
}

export interface DateFormElement extends BaseFormElement {
  type: 'date';
}

export interface FileFormElement extends BaseFormElement {
  type: 'file';
  accept?: string; 
}

export interface TableFormElement extends BaseFormElement { // Added TableFormElement
  type: 'table';
  rows: number;
  cols: number;
}

export type FormElement =
  | TextFormElement
  | NumberFormElement
  | EmailFormElement
  | TextareaFormElement
  | OptionsFormElement
  | CheckboxFormElement
  | DateFormElement
  | FileFormElement
  | TableFormElement; // Added TableFormElement to union

export type FormDefinition = FormElement[];

// Helper to create a new form element with defaults
export const createNewFormElement = (type: ElementType): FormElement => {
  const id = crypto.randomUUID();
  const baseElement: Omit<BaseFormElement, 'type'> = {
    id,
    name: `${type}_${id.substring(0, 4)}`,
    label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
    required: false,
  };

  switch (type) {
    case 'text':
      return { ...baseElement, type, placeholder: 'Enter text' } as TextFormElement;
    case 'number':
      return { ...baseElement, type, placeholder: 'Enter a number' } as NumberFormElement;
    case 'email':
      return { ...baseElement, type, placeholder: 'Enter email address' } as EmailFormElement;
    case 'textarea':
      return { ...baseElement, type, placeholder: 'Enter long text', rows: 3 } as TextareaFormElement;
    case 'dropdown':
      return {
        ...baseElement,
        type,
        options: [
          { id: crypto.randomUUID(), label: 'Option 1', value: 'option1' },
          { id: crypto.randomUUID(), label: 'Option 2', value: 'option2' },
        ],
      } as OptionsFormElement;
    case 'radio':
      return {
        ...baseElement,
        type,
        options: [
          { id: crypto.randomUUID(), label: 'Choice 1', value: 'choice1' },
          { id: crypto.randomUUID(), label: 'Choice 2', value: 'choice2' },
        ],
      } as OptionsFormElement;
    case 'checkbox':
      return { ...baseElement, type, label: 'Agree to terms' } as CheckboxFormElement;
    case 'date':
      return { ...baseElement, type } as DateFormElement;
    case 'file':
      return { ...baseElement, type } as FileFormElement;
    case 'table': // Added case for 'table'
      return { ...baseElement, type, rows: 3, cols: 2 } as TableFormElement;
    default:
      throw new Error(`Unsupported element type: ${type}`);
  }
};
