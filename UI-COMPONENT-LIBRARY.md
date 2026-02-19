# UI Component Library Documentation

## Overview

The UI Component Library provides a collection of reusable, accessible, and themable React components designed to maintain consistency across the Smart Employees platform. All components follow the n8n-inspired design system with dark theme, gradients, and smooth interactions.

---

## Components

### 1. Button

Versatile button component with multiple variants and states.

**Variants:** primary, secondary, danger, success, warning, ghost
**Sizes:** sm, md, lg

```jsx
import { Button } from '@/components/shared';

// Basic usage
<Button>Click Me</Button>

// With variants
<Button variant="primary" size="lg">Save</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Link Button</Button>

// With states
<Button disabled>Disabled</Button>
<Button loading>Processing...</Button>

// With icon
<Button icon="👍">Like</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Custom styling
<Button 
  style={{ borderRadius: '20px' }}
  onClick={() => alert('Clicked!')}
>
  Custom Button
</Button>
```

**Props:**
- `variant`: primary | secondary | danger | success | warning | ghost
- `size`: sm | md | lg
- `disabled`: boolean
- `loading`: boolean (shows spinner)
- `icon`: React node
- `fullWidth`: boolean
- `onClick`: function
- `type`: button | submit | reset

---

### 2. Card

Container component for grouping related content.

**Variants:** default, elevated, outlined, filled

```jsx
import { Card } from '@/components/shared';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// With variant
<Card variant="elevated">
  <h3>Premium Card</h3>
</Card>

<Card variant="outlined">
  <h3>Outlined Card</h3>
</Card>

// Hoverable card (shows lift effect on hover)
<Card hoverable onClick={() => console.log('clicked')}>
  <h3>Clickable Card</h3>
</Card>

// Without shadow
<Card shadow={false}>
  <h3>Flat Card</h3>
</Card>
```

**Props:**
- `variant`: default | elevated | outlined | filled
- `hoverable`: boolean (adds hover transform effect)
- `shadow`: boolean (default: true)
- `onClick`: function

---

### 3. Badge

Small label component for displaying status, tags, or categories.

**Variants:** default, primary, success, warning, danger, info
**Sizes:** sm, md, lg

```jsx
import { Badge } from '@/components/shared';

// Basic badge
<Badge>Label</Badge>

// With variant
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Failed</Badge>

// With icon
<Badge icon="✓" variant="success">Completed</Badge>
<Badge icon="⏳" variant="warning">In Progress</Badge>

// Dismissible badge
<Badge dismissible onDismiss={() => console.log('dismissed')}>
  Closeable Badge
</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>

// Combined
<Badge 
  variant="primary" 
  size="md" 
  icon="🔔"
  dismissible
>
  Notification
</Badge>
```

**Props:**
- `variant`: default | primary | success | warning | danger | info
- `size`: sm | md | lg
- `icon`: React node
- `dismissible`: boolean
- `onDismiss`: function

---

### 4. FormInput

Text input, textarea, and select component with validation.

```jsx
import { FormInput } from '@/components/shared';
import { useState } from 'react';

function MyForm() {
  const [values, setValues] = useState({
    email: '',
    password: '',
    message: '',
    category: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Text input
  return (
    <>
      <FormInput
        label="Email Address"
        type="email"
        placeholder="your@email.com"
        value={values.email}
        onChange={handleChange('email')}
        error={errors.email}
        helper="We'll never share your email"
        icon="✉️"
        required
      />

      {/* Password input */}
      <FormInput
        label="Password"
        type="password"
        placeholder="••••••••"
        value={values.password}
        onChange={handleChange('password')}
        required
      />

      {/* Textarea */}
      <FormInput
        label="Message"
        type="textarea"
        placeholder="Write your message here..."
        value={values.message}
        onChange={handleChange('message')}
        rows={5}
      />

      {/* Select dropdown */}
      <FormInput
        label="Category"
        type="select"
        value={values.category}
        onChange={handleChange('category')}
        options={[
          { value: 'sales', label: 'Sales' },
          { value: 'support', label: 'Support' },
          { value: 'other', label: 'Other' },
        ]}
        placeholder="Select a category..."
        required
      />

      {/* Number input */}
      <FormInput
        label="Age"
        type="number"
        placeholder="Enter your age"
        value={values.age}
        onChange={handleChange('age')}
        min="0"
        max="120"
      />
    </>
  );
}
```

**Props:**
- `label`: string
- `type`: text | email | password | number | textarea | select
- `placeholder`: string
- `value`: string | number
- `onChange`: function
- `onBlur`: function
- `error`: string (displays error message)
- `helper`: string (displays helper text)
- `disabled`: boolean
- `required`: boolean
- `icon`: React node
- `options`: array (for select type) - `[{ value: '', label: '' }]`
- `rows`: number (for textarea type, default: 4)

---

### 5. Modal

Dialog/popup component with overlay and customizable content.

```jsx
import { Modal, Button } from '@/components/shared';
import { useState } from 'react';

function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        size="md"
        closeOnBackdrop={true}
        footer={
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button 
              variant="secondary" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                console.log('Confirmed!');
                setIsOpen(false);
              }}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to proceed with this action?</p>
      </Modal>
    </>
  );
}
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: sm | md | lg | xl | full
- `footer`: React node
- `closeOnBackdrop`: boolean (default: true)

---

### 6. Table

Data table with sorting, pagination, and row actions.

```jsx
import { Table, Button } from '@/components/shared';

function DataTable() {
  const columns = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'email', label: 'Email' },
    { key: 'status', 
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'active' ? 'success' : 'warning'}>
          {value}
        </Badge>
      )
    },
    { key: 'createdAt', 
      label: 'Created',
      render: (date) => new Date(date).toLocaleDateString('ar-SA')
    },
  ];

  const data = [
    { id: 1, name: 'Ahmed', email: 'ahmed@example.com', status: 'active', createdAt: '2024-01-15' },
    { id: 2, name: 'Fatima', email: 'fatima@example.com', status: 'inactive', createdAt: '2024-01-16' },
    { id: 3, name: 'Mohammed', email: 'mohammed@example.com', status: 'active', createdAt: '2024-01-17' },
  ];

  const actions = [
    { 
      label: 'Edit',
      icon: '✏️',
      onClick: (row) => console.log('Edit:', row) 
    },
    { 
      label: 'Delete',
      icon: '🗑️',
      onClick: (row) => console.log('Delete:', row)
    },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      actions={actions}
      keyExtractor={(item) => item.id}
      sortable={true}
      paginated={true}
      pageSize={10}
      striped={true}
      hover={true}
      onRowClick={(row) => console.log('Row clicked:', row)}
    />
  );
}
```

**Props:**
- `columns`: array of `{ key, label, width?, align?, render? }`
- `data`: array of objects
- `keyExtractor`: function(item, index) -> key
- `actions`: array of `{ label, icon?, onClick }`
- `onRowClick`: function(row)
- `sortable`: boolean (default: true)
- `paginated`: boolean (default: false)
- `pageSize`: number (default: 10)
- `striped`: boolean (default: true)
- `hover`: boolean (default: true)

---

## Color Variants

All components use CSS variables for theming:

- `--accent`: #8B5CF6 (Primary Purple)
- `--n8n-surface-card`: Dark card background
- `--n8n-border`: Border color
- `--text-secondary`: #D1D5DB
- `--text-muted`: #9CA3AF
- `--success`: #10B981
- `--warning`: #F59E0B
- `--danger`: #EF4444

---

## Best Practices

1. **Use the component library** for consistency instead of inline styles
2. **Combine components** - Cards with Buttons, Tables with Modals, etc.
3. **Leverage variants** - Use semantic colors (danger for delete, success for create)
4. **Keep forms accessible** - Always provide labels for FormInput
5. **Test interactions** - Ensure buttons, modals, and tables work smoothly
6. **Import from index** - Use `import { Button, Card } from '@/components/shared'`

---

## Migration Guide

### Before (Scattered inline styles):
```jsx
<div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
  <h3>Old Style Card</h3>
  <button style={{ background: 'var(--accent)', color: 'black', padding: '0.75rem 1.5rem' }}>
    Click Me
  </button>
</div>
```

### After (Using components):
```jsx
<Card>
  <h3>New Style Card</h3>
  <Button variant="primary">Click Me</Button>
</Card>
```

---

## Contributing

To add new components:
1. Create component file in `src/components/shared/ComponentName.jsx`
2. Add export to `src/components/shared/index.js`
3. Update this documentation with usage examples
4. Ensure accessibility and mobile responsiveness

---

**Last Updated:** 2024
**Maintained By:** Development Team
