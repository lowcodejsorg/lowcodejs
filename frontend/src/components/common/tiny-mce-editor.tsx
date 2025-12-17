import { cn } from "@/lib/utils";
import { Editor } from "@tinymce/tinymce-react";
import React from "react";
import {
  useFormContext,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import { FormControl, FormItem, FormLabel, FormMessage } from "../ui/form";

type TinyMCEEditorProps = {
  field: ControllerRenderProps<FieldValues>;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  label?: string;
  height?: number;
};

export function TinyMCEEditor({
  field,
  defaultValue = "",
  placeholder = "Comece a digitar aqui...",
  required = false,
  label = "Conteúdo",
  height = 400,
}: TinyMCEEditorProps) {
  const [content, setContent] = React.useState<string>(defaultValue);

  // Initialize form field with default value
  React.useEffect(() => {
    if (defaultValue) {
      field.onChange(defaultValue);
      setContent(defaultValue);
    }
  }, [defaultValue, field]);

  // Sync with field value changes from outside
  React.useEffect(() => {
    if (field.value !== content) {
      setContent(field.value || "");
    }
  }, [content, field.value]);

  const handleEditorChange = (content: string) => {
    setContent(content);
    field.onChange(content);
  };

  const form = useFormContext();
  const hasError = !!form.formState.errors[field.name];

  const editorConfig = {
    height: height,
    menubar: true,
    resize: false,
    autosave_ask_before_unload: false,
    powerpaste_allow_local_images: true,
    plugins: [
      "a11ychecker advcode advlist anchor autolink codesample fullscreen help image imagetools",
      "lists link media powerpaste preview searchreplace table visualblocks wordcount",
    ],
    toolbar:
      "undo redo | bold italic | forecolor backcolor | formatselect | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | codesample | fullscreen preview help",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
    placeholder: placeholder,
    block_formats:
      "Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Preformatted=pre",
    fontsize_formats: "8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt",
    font_formats:
      "Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Symbol=symbol; Tahoma=tahoma,arial,helvetica,sans-serif; Terminal=terminal,monaco; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva",
    setup: (editor: any) => {
      editor.on("init", () => {
        // Set initial content when editor is ready
        if (content) {
          editor.setContent(content);
        }
      });
    },
  };

  return (
    <FormItem>
      <FormLabel className="data-[error=true]:text-destructive">
        {label} {required && <span className="text-destructive">*</span>}
      </FormLabel>
      <FormControl>
        <div
          className={cn(
            "border rounded-md overflow-hidden",
            hasError && "border-destructive"
          )}
        >
          <Editor
            apiKey="ffcl7xw5f4rudy7nqerr0uugul674xzflq9jz1eu3zw80ty3" // Use no-api-key for development, ou adicione sua API key
            value={content}
            onEditorChange={handleEditorChange}
            init={editorConfig}
          />
        </div>
      </FormControl>
      <FormMessage className="text-right text-destructive" />
    </FormItem>
  );
}
