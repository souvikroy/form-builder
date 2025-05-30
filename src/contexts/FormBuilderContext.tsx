
"use client";
import type React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { FormDefinition, FormElement, ElementType, FormElementOption, OptionsFormElement } from '@/lib/types';
import { createNewFormElement } from '@/lib/types';

interface FormBuilderContextType {
  formDefinition: FormDefinition;
  addElement: (elementType: ElementType, position?: { x: number; y: number }, index?: number) => FormElement;
  removeElement: (elementId: string) => void;
  updateElement: (elementId: string, updates: Partial<FormElement>) => void;
  selectedElement: FormElement | null;
  setSelectedElement: (element: FormElement | null) => void;
  moveElement: (dragIndex: number, hoverIndex: number) => void; // This might be less relevant for 2D positioning
  updateOption: (elementId: string, optionId: string, optionUpdates: Partial<FormElementOption>) => void;
  addOption: (elementId: string) => void;
  removeOption: (elementId: string, optionId: string) => void;
}

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(undefined);

export const FormBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formDefinition, setFormDefinition] = useState<FormDefinition>([]);
  const [selectedElement, setSelectedElementInternal] = useState<FormElement | null>(null);

  const addElement = useCallback(
    (elementType: ElementType, position?: { x: number; y: number }, index?: number): FormElement => {
    const newElementBase = createNewFormElement(elementType);
    const newElementWithPosition = {
      ...newElementBase,
      x: position?.x ?? newElementBase.x ?? 0,
      y: position?.y ?? newElementBase.y ?? 0,
    };

    setFormDefinition(prev => {
      const newDef = [...prev];
      // Index-based insertion is kept for logical order but doesn't dictate visual position anymore
      if (index !== undefined && index >= 0 && index <= newDef.length) {
        newDef.splice(index, 0, newElementWithPosition);
      } else {
        newDef.push(newElementWithPosition);
      }
      return newDef;
    });
    setSelectedElementInternal(newElementWithPosition);
    return newElementWithPosition;
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

  // moveElement primarily affects the logical order in the array, not direct visual x/y positioning.
  // Its utility in a 2D free-form canvas might be for accessibility (tab order) or data export order.
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
         // To ensure consistency, re-fetch the element from the updated formDefinition if possible,
         // or rely on useEffect in PropertyEditor to pick up changes.
         // For simplicity here, we'll update it similarly, but this could be improved.
        const optionsEl = prevSel as OptionsFormElement;
        const newOption: FormElementOption = {
          id: crypto.randomUUID(), 
          label: `New Option ${optionsEl.options.length + 1}`,
          value: `option${optionsEl.options.length + 1}`
        };
        const updatedSelectedElement = { ...optionsEl, options: [...optionsEl.options, newOption] };
        // It's better if PropertyEditor derives its state from formDefinition to avoid stale selectedElement state.
        // For now, this attempts to keep selectedElement in sync.
        setFormDefinition(currentFormDef => {
            const matchingElement = currentFormDef.find(e => e.id === elementId);
            if (matchingElement) setSelectedElementInternal(matchingElement);
            return currentFormDef;
        });
        return updatedSelectedElement;
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
        const updatedSelectedElement = { ...optionsEl, options: optionsEl.options.filter(opt => opt.id !== optionId) };
        setFormDefinition(currentFormDef => {
            const matchingElement = currentFormDef.find(e => e.id === elementId);
            if (matchingElement) setSelectedElementInternal(matchingElement);
            return currentFormDef;
        });
        return updatedSelectedElement;
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
