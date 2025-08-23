# Function Graph Component

The `FunctionGraphComponent` is an Angular component that visualizes the relationships between functions in an FMEA document using Rete.js node editor.

## Location
`src/app/components/function-graph.component.ts`

## Features

- **Interactive Node Graph**: Visual representation of functions as nodes with connections showing dependencies
- **Hierarchical Layout**: Functions are arranged by level (1, 2, 3) with proper spacing
- **Function Details**: Each node shows function code, name, and level
- **Prerequisites Visualization**: Connections between nodes show function dependencies
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Shows loading indicator while generating the graph

## Usage

### Basic Usage

```html
<app-function-graph 
  [fmeaDoc]="fmeaDocument" 
  [structure]="selectedStructure">
</app-function-graph>
```

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fmeaDoc` | `FMEADto2 \| null` | Yes | The complete FMEA document containing functions data |
| `structure` | `FMStructureDto2 \| null` | Yes | The structure for which to show functions |

### Data Structure Requirements

#### FMEADto2
The FMEA document should contain:
- `fmFunctions`: Array of function objects
- `fmStructures`: Array of structure objects (used for reference)

#### FMFunctionDto2
Each function should have:
- `code`: Unique identifier
- `longName`: Full function name
- `shortName`: Abbreviated name
- `level`: Function level (1, 2, 3)
- `fmStructureCode`: Associated structure code
- `prerequisites`: Array of function codes that this function depends on

#### FMStructureDto2
Each structure should have:
- `code`: Unique identifier
- `longName`: Full structure name
- `shortName`: Abbreviated name
- `decomposition`: Array of child structure codes
- `functions`: Array of function codes belonging to this structure

## Component Behavior

1. **Function Filtering**: Shows only functions that belong to the selected structure and its children
2. **Automatic Layout**: Positions nodes hierarchically based on function levels
3. **Connection Creation**: Creates visual connections based on function prerequisites
4. **Interactive Features**: 
   - Node selection (Ctrl+click for multiple)
   - Drag and drop
   - Zoom and pan
   - Fit to view

## Styling

The component includes comprehensive CSS styling for:
- Function nodes with level-based color coding
- Connection lines
- Loading states
- Responsive layout

### Level Color Coding
- **Level 1**: Blue (#1890ff)
- **Level 2**: Green (#52c41a)  
- **Level 3**: Orange (#faad14)

## Example Data Structure

```typescript
const mockFmea: FMEADto2 = {
  fmFunctions: [
    {
      code: 'F1',
      longName: '系统初始化',
      shortName: '初始化',
      level: 1,
      fmStructureCode: 'S1',
      prerequisites: [],
      faultRefs: []
    },
    {
      code: 'F2',
      longName: '系统监控',
      shortName: '监控',
      level: 1,
      fmStructureCode: 'S1',
      prerequisites: ['F1'], // Depends on F1
      faultRefs: []
    }
  ],
  fmStructures: [
    {
      code: 'S1',
      longName: '主系统',
      shortName: '主系统',
      decomposition: ['S1.1', 'S1.2'],
      functions: ['F1', 'F2']
    }
  ]
};
```

## Demo

See the live demo at:
- Basic Demo: `/demo`
- Function Graph Demo: `/demo/function-graph`

## Dependencies

- Rete.js core libraries
- Angular 19+
- RxJS
- Ng-Zorro UI components (for demo)

## Notes

- The component runs outside Angular's change detection zone for better performance
- Error handling is included for graph initialization failures
- The component automatically clears and rebuilds the graph when input data changes
