import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Checkbox, 
  Card, 
  Badge,
  theme 
} from '../../components/design-system';

const DesignSystemDemo = () => {
  // State for form controls
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  
  // Options for select
  const selectOptions = [
    { value: '', label: 'Select an option' },
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Design System</h1>
          <p className="mt-2 text-gray-600">
            A showcase of the Excel Medical Staffing design system components.
          </p>
        </div>

        {/* Colors */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Colors</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Primary</h3>
            <div className="grid grid-cols-10 gap-2">
              {Object.entries(theme.colors.primary).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center">
                  <div 
                    className="h-12 w-12 rounded-md mb-1" 
                    style={{ backgroundColor: value }}
                  ></div>
                  <span className="text-xs text-gray-600">{key}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Secondary</h3>
            <div className="grid grid-cols-10 gap-2">
              {Object.entries(theme.colors.secondary).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center">
                  <div 
                    className="h-12 w-12 rounded-md mb-1" 
                    style={{ backgroundColor: value }}
                  ></div>
                  <span className="text-xs text-gray-600">{key}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Success, Warning, Danger</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Success</h4>
                <div className="grid grid-cols-5 gap-1">
                  {[50, 300, 500, 700, 900].map((key) => (
                    <div key={key} className="flex flex-col items-center">
                      <div 
                        className="h-8 w-8 rounded-md mb-1" 
                        style={{ backgroundColor: theme.colors.success[key] }}
                      ></div>
                      <span className="text-xs text-gray-600">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Warning</h4>
                <div className="grid grid-cols-5 gap-1">
                  {[50, 300, 500, 700, 900].map((key) => (
                    <div key={key} className="flex flex-col items-center">
                      <div 
                        className="h-8 w-8 rounded-md mb-1" 
                        style={{ backgroundColor: theme.colors.warning[key] }}
                      ></div>
                      <span className="text-xs text-gray-600">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Danger</h4>
                <div className="grid grid-cols-5 gap-1">
                  {[50, 300, 500, 700, 900].map((key) => (
                    <div key={key} className="flex flex-col items-center">
                      <div 
                        className="h-8 w-8 rounded-md mb-1" 
                        style={{ backgroundColor: theme.colors.danger[key] }}
                      ></div>
                      <span className="text-xs text-gray-600">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Gray</h3>
            <div className="grid grid-cols-10 gap-2">
              {Object.entries(theme.colors.gray).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center">
                  <div 
                    className="h-12 w-12 rounded-md mb-1" 
                    style={{ backgroundColor: value }}
                  ></div>
                  <span className="text-xs text-gray-600">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Typography</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Headings</h3>
            <div className="space-y-4">
              <div>
                <h1 className="text-5xl font-bold">Heading 1</h1>
                <span className="text-sm text-gray-500">text-5xl font-bold</span>
              </div>
              <div>
                <h2 className="text-4xl font-bold">Heading 2</h2>
                <span className="text-sm text-gray-500">text-4xl font-bold</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold">Heading 3</h3>
                <span className="text-sm text-gray-500">text-3xl font-bold</span>
              </div>
              <div>
                <h4 className="text-2xl font-semibold">Heading 4</h4>
                <span className="text-sm text-gray-500">text-2xl font-semibold</span>
              </div>
              <div>
                <h5 className="text-xl font-semibold">Heading 5</h5>
                <span className="text-sm text-gray-500">text-xl font-semibold</span>
              </div>
              <div>
                <h6 className="text-lg font-semibold">Heading 6</h6>
                <span className="text-sm text-gray-500">text-lg font-semibold</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Text</h3>
            <div className="space-y-4">
              <div>
                <p className="text-base">
                  This is base text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <span className="text-sm text-gray-500">text-base</span>
              </div>
              <div>
                <p className="text-sm">
                  This is small text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <span className="text-sm text-gray-500">text-sm</span>
              </div>
              <div>
                <p className="text-xs">
                  This is extra small text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <span className="text-sm text-gray-500">text-xs</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Font Weights</h3>
            <div className="space-y-2">
              <p className="font-light">Font Light (300)</p>
              <p className="font-normal">Font Normal (400)</p>
              <p className="font-medium">Font Medium (500)</p>
              <p className="font-semibold">Font Semibold (600)</p>
              <p className="font-bold">Font Bold (700)</p>
              <p className="font-extrabold">Font Extra Bold (800)</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Buttons</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" size="xs">Extra Small</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" size="xl">Extra Large</Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">States</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Normal</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" fullWidth>Full Width</Button>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">With Icons</h3>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="primary"
                leftIcon={
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Add Item
              </Button>
              
              <Button
                variant="secondary"
                rightIcon={
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              >
                Next
              </Button>
              
              <Button
                variant="outline"
                leftIcon={
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                }
              >
                Back
              </Button>
            </div>
          </div>
        </section>

        {/* Form Controls */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Form Controls</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Input</h3>
            <div className="space-y-4 max-w-md">
              <Input
                label="Standard Input"
                name="standard"
                placeholder="Enter text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              
              <Input
                label="With Help Text"
                name="withHelp"
                placeholder="Enter text"
                helpText="This is some helpful text."
              />
              
              <Input
                label="With Error"
                name="withError"
                placeholder="Enter text"
                error={true}
                errorMessage="This field is required."
              />
              
              <Input
                label="Disabled Input"
                name="disabled"
                placeholder="Enter text"
                disabled
              />
              
              <Input
                label="With Left Icon"
                name="withLeftIcon"
                placeholder="Search..."
                leftIcon={
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              
              <Input
                label="With Right Icon"
                name="withRightIcon"
                placeholder="Enter email"
                rightIcon={
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Select</h3>
            <div className="space-y-4 max-w-md">
              <Select
                label="Standard Select"
                name="standardSelect"
                options={selectOptions}
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
              />
              
              <Select
                label="With Help Text"
                name="selectWithHelp"
                options={selectOptions}
                helpText="This is some helpful text."
              />
              
              <Select
                label="With Error"
                name="selectWithError"
                options={selectOptions}
                error={true}
                errorMessage="Please select an option."
              />
              
              <Select
                label="Disabled Select"
                name="disabledSelect"
                options={selectOptions}
                disabled
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Checkbox</h3>
            <div className="space-y-4 max-w-md">
              <Checkbox
                label="Standard Checkbox"
                name="standardCheckbox"
                checked={checkboxValue}
                onChange={(e) => setCheckboxValue(e.target.checked)}
              />
              
              <Checkbox
                label="With Help Text"
                name="checkboxWithHelp"
                helpText="This is some helpful text."
              />
              
              <Checkbox
                label="With Error"
                name="checkboxWithError"
                error={true}
                errorMessage="This field is required."
              />
              
              <Checkbox
                label="Disabled Checkbox"
                name="disabledCheckbox"
                disabled
              />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Basic Card">
              <p className="text-gray-700">
                This is a basic card with a title and content.
              </p>
            </Card>
            
            <Card
              title="Card with Action"
              titleAction={
                <Button variant="primary" size="sm">Action</Button>
              }
            >
              <p className="text-gray-700">
                This card has a title with an action button.
              </p>
            </Card>
            
            <Card
              title="Card with Footer"
              footer={
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" className="mr-2">Cancel</Button>
                  <Button variant="primary" size="sm">Save</Button>
                </div>
              }
            >
              <p className="text-gray-700">
                This card has a footer with action buttons.
              </p>
            </Card>
            
            <Card
              variant="elevated"
              hoverable
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">Elevated & Hoverable Card</h3>
              <p className="text-gray-700">
                This card has an elevated style and hover effect.
              </p>
            </Card>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Badges</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sizes</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">Small</Badge>
              <Badge variant="primary" size="md">Medium</Badge>
              <Badge variant="primary" size="lg">Large</Badge>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Styles</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Default</Badge>
              <Badge variant="primary" rounded>Rounded</Badge>
              <Badge variant="primary" bordered>Bordered</Badge>
              <Badge variant="primary" rounded bordered>Rounded & Bordered</Badge>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">With Icons</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="success"
                leftIcon={
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                Completed
              </Badge>
              
              <Badge
                variant="warning"
                leftIcon={
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Pending
              </Badge>
              
              <Badge
                variant="danger"
                leftIcon={
                  <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                Failed
              </Badge>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Removable</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'Vue', 'Angular'].map((tag) => (
                <Badge
                  key={tag}
                  variant="primary"
                  rounded
                  removable
                  onRemove={() => alert(`Remove ${tag}`)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemDemo;