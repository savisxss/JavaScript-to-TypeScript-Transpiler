# JavaScript to TypeScript Transpiler

A sophisticated transpiler that converts JavaScript code to TypeScript with intelligent type inference, interface generation, and advanced AST manipulation.

## ✨ Features

### Core Capabilities
- **Intelligent Type Inference** - Analyzes code patterns to infer accurate types
- **Automatic Interface Generation** - Creates TypeScript interfaces from complex objects
- **Function Signature Analysis** - Infers parameter and return types from usage patterns
- **Class Type Enhancement** - Adds type annotations to class properties and methods
- **Advanced AST Processing** - Deep syntax tree analysis and manipulation

### Type Inference Engine
- **Literal Type Detection** - Automatically detects string, number, boolean, and null types
- **Array Type Inference** - Handles homogeneous and union array types
- **Object Shape Analysis** - Generates precise object type definitions
- **Function Type Signatures** - Infers parameter types from usage context
- **Binary Expression Analysis** - Determines types from mathematical and logical operations
- **Call Expression Handling** - Recognizes built-in function return types

### Configuration Options
- **Strict Mode** - Enhanced type checking and stricter inference rules
- **Selective Type Inference** - Toggle automatic type detection
- **Interface Generation Control** - Enable/disable automatic interface creation
- **Explicit Any Types** - Option to add explicit `any` annotations
- **Batch Processing** - Transpile entire directories
- **Flexible I/O** - Support for custom input/output paths

## 🚀 Installation

```bash
git clone https://github.com/savisxss/javascript-to-typescript-transpiler.git
cd javascript-to-typescript-transpiler
npm install
```

## 📖 Usage

### Command Line Interface

#### Basic Usage
```bash
# Transpile input.js to output.ts
npm start

# Or use the transpiler directly
node transpiler.js
```

#### Advanced Options
```bash
# Specify custom input/output files
node transpiler.js -i src/app.js -o dist/app.ts

# Transpile entire directory
node transpiler.js -d ./src

# Enable strict mode with explicit any types
node transpiler.js --strict --explicit-any

# Disable automatic features
node transpiler.js --no-infer --no-interfaces
```

#### Command Line Options
```
-i, --input <file>      Input JavaScript file
-o, --output <file>     Output TypeScript file  
-d, --directory <dir>   Transpile all .js files in directory
--strict                Enable strict mode
--no-infer             Disable type inference
--no-interfaces        Don't generate interfaces
--explicit-any         Add explicit 'any' types
-h, --help             Show help information
```

### Programmatic API

```javascript
const { JSToTSTranspiler } = require('./transpiler');

const transpiler = new JSToTSTranspiler({
    strictMode: true,
    inferTypes: true,
    generateInterfaces: true,
    addExplicitAny: false
});

// Transpile file
await transpiler.transpile('input.js', 'output.ts');

// Transpile code string
const tsCode = transpiler.transpileCode(jsCodeString);
```

## 🎯 Examples

### Input JavaScript
```javascript
function calculateTotal(items, taxRate) {
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    return subtotal * (1 + taxRate);
}

const user = {
    name: "John Doe",
    age: 30,
    preferences: {
        theme: "dark",
        notifications: true
    }
};

class DataProcessor {
    constructor(config) {
        this.config = config;
        this.cache = [];
    }
    
    process(data) {
        return data.map(item => item.value * 2);
    }
}
```

### Generated TypeScript
```typescript
interface Interface1 {
    theme: string;
    notifications: boolean;
}

interface Interface2 {
    name: string;
    age: number;
    preferences: Interface1;
}

function calculateTotal(items: { price: number }[], taxRate: number): number {
    const subtotal: number = items.reduce((sum: number, item: { price: number }) => sum + item.price, 0);
    return subtotal * (1 + taxRate);
}

const user: Interface2 = {
    name: "John Doe",
    age: 30,
    preferences: {
        theme: "dark",
        notifications: true
    }
};

class DataProcessor {
    config: unknown;
    cache: unknown[];
    
    constructor(config: unknown) {
        this.config = config;
        this.cache = [];
    }
    
    process(data: { value: number }[]): number[] {
        return data.map((item: { value: number }) => item.value * 2);
    }
}
```

## 🔧 Configuration

Create a `.js2tsrc.json` file for project-wide configuration:

```json
{
    "strictMode": true,
    "inferTypes": true,
    "generateInterfaces": true,
    "preserveComments": true,
    "addExplicitAny": false,
    "outputDirectory": "./dist"
}
```

## 🧪 Type Inference Rules

### Variable Declarations
- **Literals**: Direct type inference from values
- **Arrays**: Element type analysis with union type support
- **Objects**: Shape analysis and interface generation
- **Functions**: Parameter and return type inference

### Function Analysis
- **Parameter Types**: Inferred from usage patterns within function body
- **Return Types**: Analyzed from return statements and expressions
- **Arrow Functions**: Implicit return type detection
- **Method Signatures**: Class method type enhancement

### Advanced Patterns
- **Binary Expressions**: Mathematical and comparison operation type detection
- **Call Expressions**: Built-in function return type recognition
- **Object Destructuring**: Property type preservation
- **Template Literals**: String type inference

## 📁 Project Structure

```
javascript-to-typescript-transpiler/
├── transpiler.js          # Main transpiler engine
├── package.json           # Project configuration
├── README.md             # Documentation
├── examples/             # Example files
│   ├── sample.js         # Sample input
│   └── sample.ts         # Generated output
├── test/                 # Test suite
│   └── test.js          # Unit tests
└── .gitignore           # Git ignore rules
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Building Examples
```bash
npm run example
```

### Batch Processing
```bash
npm run transpile:dir
```

## 🚨 Known Limitations

- Complex generic types require manual annotation
- Dynamic property access patterns may need type assertions
- Circular reference detection in object types
- Advanced TypeScript features (decorators, mapped types) not generated

## 📈 Roadmap

- [ ] Generic type parameter inference
- [ ] Decorator pattern recognition
- [ ] Import/export statement enhancement
- [ ] JSDoc comment preservation and conversion
- [ ] Integration with TypeScript compiler API
- [ ] Real-time transpilation with file watching
- [ ] VS Code extension development