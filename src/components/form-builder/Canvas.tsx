
"use client";
import React from 'react';
import { useDrop } from 'react-dnd';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import type { ElementType, FormElement as FormElementType } from '@/lib/types';
import { ItemTypes } from './DraggableItem';
import CanvasElement from './CanvasElement';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DropItem {
  type: ElementType;
}

export default function Canvas() {
  const { formDefinition, addElement, moveElement, setSelectedElement, selectedElement } = useFormBuilder();

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.FORM_ELEMENT,
    drop: (item: DropItem, monitor) => {
      // If an element is dropped directly onto the canvas (not on another element for reordering)
      // and it's a new element from the sidebar.
      if (!monitor.didDrop()) { // Ensure this drop is handled by the canvas itself
         const newEl = addElement(item.type); // Adds to the end by default
         setSelectedElement(newEl);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const handleSelectElement = (element: FormElementType) => {
    setSelectedElement(element);
  };

  return (
    <ScrollArea className="h-full bg-background" ref={drop}>
      <div
        className={`min-h-full p-8 transition-colors duration-200 ${
          isOver && canDrop ? 'bg-primary/10' : 'bg-muted/20'
        } ${formDefinition.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}
        style={{ minHeight: 'calc(100vh - 4rem)' }} // Adjust based on toolbar height
      >
        {formDefinition.length === 0 ? (
          <div className="text-center text-muted-foreground p-10 border-2 border-dashed border-border rounded-lg">
            <p className="text-lg font-medium">Drag and drop elements here</p>
            <p className="text-sm">Build your form by adding elements from the left panel.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4"> {/* Changed to flex-wrap layout */}
            {formDefinition.map((element, index) => (
              // Added a wrapper for each element to control its width and allow wrapping
              <div key={element.id} className="w-full max-w-xs"> {/* Or e.g. basis-80, max-w-sm */}
                <CanvasElement
                  element={element}
                  index={index}
                  isSelected={selectedElement?.id === element.id}
                  onSelect={() => handleSelectElement(element)}
                  moveElement={moveElement}
                />
              </div>
            ))}
          </div>
        )}
         {/* Drop target at the end of the list for new items */}
        {formDefinition.length > 0 && (
          <div className={`h-10 w-full rounded-md mt-4 ${isOver && canDrop ? 'bg-primary/20 border-2 border-dashed border-primary' : ''}`}
            aria-hidden="true"
          />
        )}
      </div>
    </ScrollArea>
  );
}
