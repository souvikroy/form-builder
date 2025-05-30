
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Download, Eye, Workflow } from 'lucide-react';
import { useFormBuilder } from '@/contexts/FormBuilderContext';
import PreviewModal from './PreviewModal';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

export default function Toolbar() {
  const { formDefinition } = useFormBuilder();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { toast } = useToast();

  const handleExportJson = () => {
    if (formDefinition.length === 0) {
      toast({
        title: "Empty Form",
        description: "Cannot export an empty form.",
        variant: "destructive",
      });
      return;
    }
    const jsonString = JSON.stringify(formDefinition, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-design.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: "Form design exported as form-design.json",
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a name for the template.",
        variant: "destructive",
      });
      return;
    }
    if (formDefinition.length === 0) {
      toast({
        title: "Empty Form",
        description: "Cannot save an empty form as a template.",
        variant: "destructive",
      });
      return;
    }
    try {
      const templates = JSON.parse(localStorage.getItem('formTemplates') || '[]');
      templates.push({ name: templateName, definition: formDefinition });
      localStorage.setItem('formTemplates', JSON.stringify(templates));
      toast({
        title: "Template Saved",
        description: `Template "${templateName}" saved successfully.`,
      });
      setTemplateName('');
      setIsSaveTemplateOpen(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-card shadow-sm">
        <div className="flex items-center gap-2">
          <Workflow className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Formulate</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsSaveTemplateOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="default" size="sm" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </header>
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      
      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Form Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="Enter template name" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
