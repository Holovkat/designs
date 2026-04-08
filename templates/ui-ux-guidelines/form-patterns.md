# Form Patterns

## Form Field Anatomy

Standard form field structure using shadcn/ui:

```tsx
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input placeholder="Enter value..." {...field} />
      </FormControl>
      <FormDescription>Helper text explaining the field.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Simple Form Pattern (useState)

For simpler forms without react-hook-form:

```tsx
function SimpleForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);
    try {
      await saveMutation({ name, email });
      toast.success("Saved successfully");
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />
      </div>
      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
```

## Form Layout Patterns

### Two-Column Grid

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="col-span-2">
    <Label>Full Width Field</Label>
    <Input />
  </div>
  <div>
    <Label>Left Column</Label>
    <Input />
  </div>
  <div>
    <Label>Right Column</Label>
    <Input />
  </div>
</div>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Fields */}
</div>
```

### Grouped Fields

```tsx
<div className="space-y-6">
  {/* Section 1 */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold">Section Title</h3>
    <div className="grid grid-cols-2 gap-4">
      {/* Fields */}
    </div>
  </div>

  <Separator />

  {/* Section 2 */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold">Another Section</h3>
    {/* Fields */}
  </div>
</div>
```

## Input Types

### Text Input

```tsx
<div>
  <Label htmlFor="fieldName">Field Label</Label>
  <Input
    id="fieldName"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Enter value..."
  />
</div>
```

### Textarea

```tsx
<div>
  <Label htmlFor="notes">Notes</Label>
  <Textarea
    id="notes"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Add notes..."
    rows={4}
  />
</div>
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<div>
  <Label>Status</Label>
  <Select value={status} onValueChange={setStatus}>
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="draft">Draft</SelectItem>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="archived">Archived</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Checkbox

```tsx
<div className="flex items-center space-x-2">
  <Checkbox
    id="accept"
    checked={accepted}
    onCheckedChange={(checked) => setAccepted(checked as boolean)}
  />
  <Label htmlFor="accept" className="cursor-pointer">
    I accept the terms
  </Label>
</div>
```

### Switch

```tsx
<div className="flex items-center justify-between">
  <Label htmlFor="notifications">Enable Notifications</Label>
  <Switch
    id="notifications"
    checked={notifications}
    onCheckedChange={setNotifications}
  />
</div>
```

### Radio Group

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

<div>
  <Label>Priority</Label>
  <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-4 mt-2">
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="low" id="low" />
      <Label htmlFor="low">Low</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="medium" id="medium" />
      <Label htmlFor="medium">Medium</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="high" id="high" />
      <Label htmlFor="high">High</Label>
    </div>
  </RadioGroup>
</div>
```

## Inline Edit Pattern

Editable fields that toggle between display and edit mode:

```tsx
function InlineEdit({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:text-primary"
      onClick={() => setIsEditing(true)}
    >
      {value || "Click to edit"}
    </div>
  );
}
```

## Inspector Form Pattern

Full-screen inspector with scrollable form:

```tsx
function CreateInspector({ onClose, onCreated }) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create New Item</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Form Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Form sections */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            {/* Fields */}
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Details</h3>
            {/* Fields */}
          </div>
        </div>
      </ScrollArea>

      {/* Fixed Footer */}
      <div className="p-4 border-t flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

## Wizard Pattern

Multi-step form wizard:

### Wizard Shell

```tsx
function WizardShell({ title, description, children, onClose, closeDisabled = false }) {
  // ESC key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !closeDisabled) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, closeDisabled]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
        <div className="flex-1" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          <Button variant="ghost" size="icon" onClick={onClose} disabled={closeDisabled}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content - includes step indicator, content, navigation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

### Wizard Step Indicator

```tsx
function WizardStepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 p-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              index < currentStep && "bg-primary text-primary-foreground",
              index === currentStep && "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2",
              index > currentStep && "bg-muted text-muted-foreground"
            )}
          >
            {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-12 h-0.5 mx-2",
              index < currentStep ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Wizard Navigation

```tsx
function WizardNavigation({
  onBack,
  onNext,
  onComplete,
  isFirstStep,
  isLastStep,
  isLoading,
  canProceed,
}) {
  return (
    <div className="flex items-center justify-between p-4 border-t">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep || isLoading}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {isLastStep ? (
        <Button onClick={onComplete} disabled={!canProceed || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Complete
              <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canProceed || isLoading}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

## Search Input Pattern

```tsx
<div className="relative flex-1">
  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search..."
    value={searchValue}
    onChange={(e) => onSearchChange(e.target.value)}
    className="pl-8"
  />
  {searchValue && (
    <Button
      variant="ghost"
      size="icon-sm"
      className="absolute right-1 top-1"
      onClick={() => onSearchChange("")}
    >
      <X className="h-4 w-4" />
    </Button>
  )}
</div>
```

## Location Picker Map

Interactive map for selecting coordinates:

```tsx
function LocationPickerMap({
  coordinates,
  onCoordinatesChange,
  onAddressChange,
}) {
  return (
    <div className="relative h-64 rounded-lg border overflow-hidden">
      {/* Mapbox GL map */}
      <Map
        center={coordinates}
        onMove={(e) => onCoordinatesChange(e.lngLat)}
      />

      {/* Search overlay */}
      <div className="absolute top-2 left-2 right-2">
        <Input
          placeholder="Search address..."
          className="bg-background/90 backdrop-blur"
        />
      </div>

      {/* Coordinates display */}
      <div className="absolute bottom-2 left-2 text-xs bg-background/90 backdrop-blur px-2 py-1 rounded">
        {coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : "Click to set location"}
      </div>
    </div>
  );
}
```

## Validation Patterns

### Required Field Indicator

```tsx
<Label htmlFor="name">
  Name <span className="text-destructive">*</span>
</Label>
```

### Error State

```tsx
<div>
  <Label htmlFor="email" className={error ? "text-destructive" : ""}>
    Email
  </Label>
  <Input
    id="email"
    className={error ? "border-destructive focus-visible:ring-destructive" : ""}
  />
  {error && (
    <p className="text-sm text-destructive mt-1">{error}</p>
  )}
</div>
```

### Field Validation on Blur

```tsx
const [value, setValue] = useState("");
const [error, setError] = useState("");

const validate = () => {
  if (!value.trim()) {
    setError("This field is required");
    return false;
  }
  if (value.length < 3) {
    setError("Must be at least 3 characters");
    return false;
  }
  setError("");
  return true;
};

<Input
  value={value}
  onChange={(e) => {
    setValue(e.target.value);
    if (error) setError("");
  }}
  onBlur={validate}
/>
```
