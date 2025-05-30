
"use client";
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormBuilderProvider } from '@/contexts/FormBuilderContext';
import Toolbar from '@/components/form-builder/Toolbar';
import ElementSidebar from '@/components/form-builder/ElementSidebar';
import Canvas from '@/components/form-builder/Canvas';
import PropertyEditor from '@/components/form-builder/PropertyEditor';
import { Toaster } from "@/components/ui/toaster";

export default function FormBuilderPage() {
  return (
    <DndProvider backend={HTML5Backend}>
      <FormBuilderProvider>
        <div className="flex flex-col h-screen bg-background text-foreground">
          <Toolbar />
          <div className="flex flex-1 overflow-hidden border-t border-border">
            <ElementSidebar />
            <main className="flex-1 overflow-y-auto p-0"> {/* Changed p-6 to p-0 */}
              <Canvas />
            </main>
            <PropertyEditor />
          </div>
        </div>
        <Toaster />
      </FormBuilderProvider>
    </DndProvider>
  );
}
