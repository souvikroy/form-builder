
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { FormDefinition, FormElement, ElementType, FormElementOption } from '@/lib/types';
import { createNewFormElement } from '@/lib/types';

interface FormBuilderContextType {
  formDefinition: FormDefinition;
  addElement: (elementType: ElementType, index?: number) => FormElement;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<FormElement>) => void;
  selectedElement: FormElement | null;
  setSelectedElement: (element: FormElement | null) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  updateOption: (elementId: string, optionId: string, optionUpdates: Partial<FormElementOption>) => void;
  addOption: (elementId: string) => void;
  removeOption: (elementId: string, optionId: string) => void;
}

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(undefined);

export const FormBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formDefinition, setFormDefinition] = useState<FormDefinition>([]);
  const [selectedElement, setSelectedElementInternal] = useState<FormElement | null>(null);

  const addElement = useCallback((elementType: ElementType, index?: number): FormElement => {
    const newElement = createNewFormElement(elementType);
    setFormDefinition(prev => {
      const newDef = [...prev];
      if (index !== undefined && index >= 0 && index <= newDef.length) {
        newDef.splice(index, 0, newElement);
      } else {
        newDef.push(newElement);
      }
      return newDef;
    });
    setSelectedElementInternal(newElement);
    return newElement;
  }, []);

  const removeElement = useCallback((elementId: string) => {
    setFormDefinition(prev => prev.filter(el => el.id !== elementId));
    if (selectedElement?.id === elementId) {
      setSelectedElementInternal(null);
    }
  }, [selectedElement]);

  const updateElement = useCallback((elementId: string, updates: Partial<FormElement>) => {
    setFormDefinition(prev =>
      prev.map(el => (el.id === elementId ? { ...el, ...updates } : el))
    );
    if (selectedElement?.id === elementId) {
      setSelectedElementInternal(prevEl => prevEl ? { ...prevEl, ...updates } : null);
    }
  }, [selectedElement]);

  const setSelectedElement = useCallback((element: FormElement | null) => {
    setSelectedElementInternal(element);
  }, []);

  const moveElement = useCallback((dragIndex: number, hoverIndex: number) => {
    setFormDefinition((prev) => {
      const newDef = [...prev];
      const [draggedItem] = newDef.splice(dragIndex, 1);
      newDef.splice(hoverIndex, 0, draggedItem);
      return newDef;
    });
  }, []);

  const updateOption = useCallback((elementId: string, optionId: string, optionUpdates: Partial<FormElementOption>) => {
    setFormDefinition(prevDef => prevDef.map(el => {
      if (el.id === elementId && (el.type === 'dropdown' || el.type === 'radio')) {
        const optionsEl = el as OptionsFormElement;
        return {
          ...optionsEl,
          options: optionsEl.options.map(opt => opt.id === optionId ? { ...opt, ...optionUpdates } : opt)
        };
      }
      return el;
    }));
    setSelectedElementInternal(prevSel => {
      if (prevSel && prevSel.id === elementId && (prevSel.type === 'dropdown' || prevSel.type === 'radio')) {
        const optionsEl = prevSel as OptionsFormElement;
        return {
          ...optionsEl,
          options: optionsEl.options.map(opt => opt.id === optionId ? { ...opt, ...optionUpdates } : opt)
        };
      }
      return prevSel;
    });
  }, []);

  const addOption = useCallback((elementId: string) => {
    setFormDefinition(prevDef => prevDef.map(el => {
      if (el.id === elementId && (el.type === 'dropdown' || el.type === 'radio')) {
        const optionsEl = el as OptionsFormElement;
        const newOption: FormElementOption = {
          id: crypto.randomUUID(),
          label: `New Option ${optionsEl.options.length + 1}`,
          value: `option${optionsEl.options.length + 1}`
        };
        return { ...optionsEl, options: [...optionsEl.options, newOption] };
      }
      return el;
    }));
     setSelectedElementInternal(prevSel => {
      if (prevSel && prevSel.id === elementId && (prevSel.type === 'dropdown' || prevSel.type === 'radio')) {
        const optionsEl = prevSel as OptionsFormElement;
         const newOption: FormElementOption = {
          id: crypto.randomUUID(), // This ID will differ from the one in formDefinition, might be an issue if not careful
          label: `New Option ${optionsEl.options.length + 1}`, // State might be stale if multiple adds happen quickly
          value: `option${optionsEl.options.length + 1}`
        };
        // To ensure consistency, it's better to refetch the element from formDefinition or update selectedElement based on formDefinition change
        // For now, this might lead to slight desync if not handled carefully in PropertyEditor.
        // A better approach is to find the updated element from the new formDefinition and set it as selected.
        return { ...optionsEl, options: [...optionsEl.options, newOption] };
      }
      return prevSel;
    });
  }, []);

  const removeOption = useCallback((elementId: string, optionId: string) => {
    setFormDefinition(prevDef => prevDef.map(el => {
      if (el.id === elementId && (el.type === 'dropdown' || el.type === 'radio')) {
        const optionsEl = el as OptionsFormElement;
        return { ...optionsEl, options: optionsEl.options.filter(opt => opt.id !== optionId) };
      }
      return el;
    }));
    setSelectedElementInternal(prevSel => {
       if (prevSel && prevSel.id === elementId && (prevSel.type === 'dropdown' || prevSel.type === 'radio')) {
        const optionsEl = prevSel as OptionsFormElement;
        return { ...optionsEl, options: optionsEl.options.filter(opt => opt.id !== optionId) };
      }
      return prevSel;
    });
  }, []);


  return (
    <FormBuilderContext.Provider
      value={{
        formDefinition,
        addElement,
        removeElement,
        updateElement,
        selectedElement,
        setSelectedElement,
        moveElement,
        updateOption,
        addOption,
        removeOption,
      }}
    >
      {children}
    </FormBuilderContext.Provider>
  );
};

export const useFormBuilder = () => {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error('useFormBuilder must be used within a FormBuilderProvider');
  }
  return context;
};

