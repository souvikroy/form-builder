
"use client";
import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ElementType } from '@/lib/types';
import DraggableItem from './DraggableItem';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Type,
  Hash,
  Mail,
  FileText,
  ChevronDownSquare,
  CircleDot,
  CheckSquare,
  CalendarDays,
  FileUp,
  Table as TableIcon,
  LayoutGrid, // Icon for categories or general grouping
} from 'lucide-react';

interface FormElementItem {
  type: ElementType;
  label: string;
  icon: React.ElementType;
}

interface ElementCategory {
  name: string;
  icon: React.ElementType;
  elements: FormElementItem[];
}

const initialElementCategories: ElementCategory[] = [
  {
    name: "Basic Inputs",
    icon: Type,
    elements: [
      { type: 'text', label: 'Text Input', icon: Type },
      { type: 'number', label: 'Number Input', icon: Hash },
      { type: 'email', label: 'Email Input', icon: Mail },
      { type: 'textarea', label: 'Text Area', icon: FileText },
    ]
  },
  {
    name: "Selection Controls",
    icon: CheckSquare,
    elements: [
      { type: 'dropdown', label: 'Dropdown', icon: ChevronDownSquare },
      { type: 'radio', label: 'Radio Group', icon: CircleDot },
      { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    ]
  },
  {
    name: "Advanced Elements",
    icon: LayoutGrid,
    elements: [
      { type: 'date', label: 'Date Picker', icon: CalendarDays },
      { type: 'file', label: 'File Upload', icon: FileUp },
      { type: 'table', label: 'Table', icon: TableIcon },
    ]
  }
];

export default function ElementSidebar() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return initialElementCategories;
    }

    return initialElementCategories
      .map(category => {
        const categoryNameMatches = category.name.toLowerCase().includes(searchTerm);
        const matchingElements = category.elements.filter(element =>
          element.label.toLowerCase().includes(searchTerm)
        );

        if (categoryNameMatches) {
          return category; // Return the whole category if its name matches
        } else if (matchingElements.length > 0) {
          // Return category with only matching elements if element labels match
          return { ...category, elements: matchingElements };
        }
        return null; // No match in this category
      })
      .filter(category => category !== null) as ElementCategory[];
  }, [searchTerm]);

  const accordionDefaultValue = searchTerm.trim()
    ? filteredCategories.map(cat => cat.name.toLowerCase().replace(/\s+/g, '-'))
    : ["basic-inputs"];

  return (
    <aside className="w-72 border-r border-border bg-card p-4 flex flex-col shadow-md">
      <h2 className="text-lg font-semibold mb-3 text-foreground px-2">Form Elements</h2>
      <div className="relative mb-3 px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search elements..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-9 h-9"
        />
      </div>
      <ScrollArea className="flex-1 -mx-2">
        {filteredCategories.length === 0 && searchTerm.trim() && (
          <p className="text-sm text-muted-foreground text-center py-4 px-2">No elements found for "{searchTerm}".</p>
        )}
        <Accordion type="multiple" value={accordionDefaultValue} className="w-full px-2">
          {filteredCategories.map((category) => (
            <AccordionItem value={`${category.name.toLowerCase().replace(/\s+/g, '-')}`} key={category.name} className="border-b-0 mb-1">
              <AccordionTrigger className="py-2 px-2 text-sm font-medium hover:bg-muted rounded-md transition-colors data-[state=open]:bg-muted">
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4 text-primary/80" />
                  {category.name}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-0">
                <div className="space-y-2 pl-3 pr-1 py-1 border-l-2 border-primary/20 ml-[7px]">
                  {category.elements.map((element) => (
                    <DraggableItem key={element.type} type={element.type} label={element.label} icon={element.icon} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </aside>
  );
}
