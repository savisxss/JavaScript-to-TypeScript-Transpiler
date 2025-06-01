const fs = require('fs').promises;
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { generate } = require('astring');

class TypeInferrer {
    constructor() {
        this.typeMap = new Map();
        this.functionSignatures = new Map();
        this.classDefinitions = new Map();
    }

    inferType(node) {
        if (!node) return 'unknown';

        switch (node.type) {
            case 'Literal':
                if (typeof node.value === 'string') return 'string';
                if (typeof node.value === 'number') return 'number';
                if (typeof node.value === 'boolean') return 'boolean';
                if (node.value === null) return 'null';
                return 'unknown';

            case 'ArrayExpression':
                if (node.elements.length === 0) return 'unknown[]';
                const elementTypes = node.elements.map(el => this.inferType(el));
                const uniqueTypes = [...new Set(elementTypes)];
                if (uniqueTypes.length === 1) return `${uniqueTypes[0]}[]`;
                return `(${uniqueTypes.join(' | ')})[]`;

            case 'ObjectExpression':
                return this.inferObjectType(node);

            case 'ArrowFunctionExpression':
            case 'FunctionExpression':
                return this.inferFunctionType(node);

            case 'BinaryExpression':
                return this.inferBinaryExpressionType(node);

            case 'CallExpression':
                return this.inferCallExpressionType(node);

            default:
                return 'unknown';
        }
    }

    inferObjectType(node) {
        const properties = node.properties.map(prop => {
            if (prop.type === 'Property') {
                const key = prop.key.name || prop.key.value;
                const valueType = this.inferType(prop.value);
                return `${key}: ${valueType}`;
            }
            return '';
        }).filter(Boolean);

        return `{ ${properties.join('; ')} }`;
    }

    inferFunctionType(node) {
        const paramTypes = node.params.map((param, index) => {
            const paramType = this.inferParameterType(param, node.body);
            return `${param.name}: ${paramType}`;
        });

        const returnType = this.inferReturnType(node.body);
        return `(${paramTypes.join(', ')}) => ${returnType}`;
    }

    inferParameterType(param, body) {
        // Analyze parameter usage in function body
        let inferredType = 'unknown';
        
        walk.simple(body, {
            BinaryExpression(node) {
                if (node.left.name === param.name) {
                    if (['+', '-', '*', '/', '%'].includes(node.operator)) {
                        inferredType = 'number';
                    } else if (['==', '===', '!=', '!=='].includes(node.operator)) {
                        inferredType = this.inferType(node.right);
                    }
                }
            },
            CallExpression(node) {
                if (node.callee.object?.name === param.name) {
                    if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(node.callee.property?.name)) {
                        inferredType = 'unknown[]';
                    } else if (['charAt', 'substring', 'indexOf'].includes(node.callee.property?.name)) {
                        inferredType = 'string';
                    }
                }
            }
        });

        return inferredType;
    }

    inferReturnType(body) {
        let returnTypes = [];

        walk.simple(body, {
            ReturnStatement(node) {
                if (node.argument) {
                    returnTypes.push(this.inferType(node.argument));
                } else {
                    returnTypes.push('void');
                }
            }
        });

        if (returnTypes.length === 0) return 'void';
        const uniqueTypes = [...new Set(returnTypes)];
        return uniqueTypes.length === 1 ? uniqueTypes[0] : uniqueTypes.join(' | ');
    }

    inferBinaryExpressionType(node) {
        if (['+', '-', '*', '/', '%'].includes(node.operator)) {
            return 'number';
        }
        if (['==', '===', '!=', '!==', '<', '>', '<=', '>='].includes(node.operator)) {
            return 'boolean';
        }
        if (node.operator === '+') {
            const leftType = this.inferType(node.left);
            const rightType = this.inferType(node.right);
            if (leftType === 'string' || rightType === 'string') {
                return 'string';
            }
        }
        return 'unknown';
    }

    inferCallExpressionType(node) {
        if (node.callee.name === 'parseInt' || node.callee.name === 'parseFloat') {
            return 'number';
        }
        if (node.callee.name === 'String') {
            return 'string';
        }
        if (node.callee.name === 'Boolean') {
            return 'boolean';
        }
        return 'unknown';
    }
}

class InterfaceGenerator {
    constructor() {
        this.interfaces = new Map();
        this.interfaceCounter = 0;
    }

    generateInterface(objectType, name = null) {
        if (!name) {
            name = `Interface${++this.interfaceCounter}`;
        }

        if (this.interfaces.has(objectType)) {
            return this.interfaces.get(objectType);
        }

        this.interfaces.set(objectType, name);
        return name;
    }

    getInterfaceDeclarations() {
        const declarations = [];
        for (const [objectType, interfaceName] of this.interfaces) {
            declarations.push(`interface ${interfaceName} ${objectType}`);
        }
        return declarations;
    }
}

class JSToTSTranspiler {
    constructor(options = {}) {
        this.options = {
            strictMode: false,
            inferTypes: true,
            generateInterfaces: true,
            preserveComments: true,
            addExplicitAny: false,
            ...options
        };
        this.typeInferrer = new TypeInferrer();
        this.interfaceGenerator = new InterfaceGenerator();
        this.imports = new Set();
        this.exports = new Set();
    }

    async transpile(inputPath, outputPath) {
        try {
            const jsCode = await fs.readFile(inputPath, 'utf8');
            const tsCode = this.transpileCode(jsCode);
            
            await fs.writeFile(outputPath, tsCode);
            console.log(`✅ Successfully transpiled ${inputPath} to ${outputPath}`);
            
            return {
                success: true,
                inputPath,
                outputPath,
                generatedInterfaces: this.interfaceGenerator.interfaces.size
            };
        } catch (error) {
            console.error(`❌ Error transpiling ${inputPath}:`, error.message);
            throw error;
        }
    }

    transpileCode(jsCode) {
        let ast;
        try {
            ast = acorn.parse(jsCode, {
                ecmaVersion: 2022,
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true
            });
        } catch (parseError) {
            throw new Error(`Parse error: ${parseError.message}`);
        }

        this.processAST(ast);
        
        const tsCode = generate(ast);
        const interfaces = this.interfaceGenerator.getInterfaceDeclarations();
        
        let result = '';
        if (interfaces.length > 0) {
            result += interfaces.join('\n\n') + '\n\n';
        }
        result += tsCode;
        
        return result;
    }

    processAST(ast) {
        const self = this;

        walk.simple(ast, {
            VariableDeclaration(node) {
                self.processVariableDeclaration(node);
            },
            FunctionDeclaration(node) {
                self.processFunctionDeclaration(node);
            },
            ArrowFunctionExpression(node) {
                self.processArrowFunction(node);
            },
            FunctionExpression(node) {
                self.processFunctionExpression(node);
            },
            ClassDeclaration(node) {
                self.processClassDeclaration(node);
            },
            ObjectExpression(node) {
                self.processObjectExpression(node);
            },
            CallExpression(node) {
                self.processCallExpression(node);
            }
        });
    }

    processVariableDeclaration(node) {
        node.declarations.forEach(declaration => {
            if (declaration.init && this.options.inferTypes) {
                const inferredType = this.typeInferrer.inferType(declaration.init);
                
                if (inferredType !== 'unknown' || this.options.addExplicitAny) {
                    declaration.id.typeAnnotation = this.createTypeAnnotation(
                        inferredType === 'unknown' ? 'any' : inferredType
                    );
                }
            }
        });
    }

    processFunctionDeclaration(node) {
        this.addParameterTypes(node);
        this.addReturnType(node);
    }

    processArrowFunction(node) {
        this.addParameterTypes(node);
        // Return type inference for arrow functions
        if (node.body.type !== 'BlockStatement') {
            const returnType = this.typeInferrer.inferType(node.body);
            if (returnType !== 'unknown') {
                node.returnType = this.createTypeAnnotation(returnType);
            }
        }
    }

    processFunctionExpression(node) {
        this.addParameterTypes(node);
        this.addReturnType(node);
    }

    processClassDeclaration(node) {
        node.body.body.forEach(member => {
            if (member.type === 'ClassProperty' && member.value) {
                const inferredType = this.typeInferrer.inferType(member.value);
                if (inferredType !== 'unknown') {
                    member.typeAnnotation = this.createTypeAnnotation(inferredType);
                }
            } else if (member.type === 'MethodDefinition') {
                this.addParameterTypes(member.value);
                this.addReturnType(member.value);
            }
        });
    }

    processObjectExpression(node) {
        if (this.options.generateInterfaces && this.isComplexObject(node)) {
            const objectType = this.typeInferrer.inferObjectType(node);
            const interfaceName = this.interfaceGenerator.generateInterface(objectType);
            
            // Add type assertion
            node.typeAssertion = interfaceName;
        }
    }

    processCallExpression(node) {
        // Handle specific function calls that might need type annotations
        if (node.callee.name === 'require' && node.arguments[0]?.type === 'Literal') {
            // Convert require to import if in module context
            const moduleName = node.arguments[0].value;
            this.imports.add(moduleName);
        }
    }

    addParameterTypes(functionNode) {
        functionNode.params.forEach(param => {
            if (!param.typeAnnotation) {
                let paramType = 'unknown';
                
                if (this.options.inferTypes) {
                    paramType = this.typeInferrer.inferParameterType(param, functionNode.body);
                }
                
                if (paramType === 'unknown' && this.options.addExplicitAny) {
                    paramType = 'any';
                }
                
                if (paramType !== 'unknown') {
                    param.typeAnnotation = this.createTypeAnnotation(paramType);
                }
            }
        });
    }

    addReturnType(functionNode) {
        if (!functionNode.returnType && functionNode.body) {
            const returnType = this.typeInferrer.inferReturnType(functionNode.body);
            if (returnType !== 'unknown' || this.options.addExplicitAny) {
                functionNode.returnType = this.createTypeAnnotation(
                    returnType === 'unknown' ? 'any' : returnType
                );
            }
        }
    }

    createTypeAnnotation(typeString) {
        return {
            type: 'TSTypeAnnotation',
            typeAnnotation: this.parseTypeString(typeString)
        };
    }

    parseTypeString(typeString) {
        // Basic type parsing - could be expanded
        const baseTypes = ['string', 'number', 'boolean', 'void', 'any', 'unknown', 'null', 'undefined'];
        
        if (baseTypes.includes(typeString)) {
            return {
                type: typeString === 'any' ? 'TSAnyKeyword' :
                      typeString === 'string' ? 'TSStringKeyword' :
                      typeString === 'number' ? 'TSNumberKeyword' :
                      typeString === 'boolean' ? 'TSBooleanKeyword' :
                      typeString === 'void' ? 'TSVoidKeyword' :
                      typeString === 'unknown' ? 'TSUnknownKeyword' :
                      typeString === 'null' ? 'TSNullKeyword' :
                      'TSUndefinedKeyword'
            };
        }
        
        if (typeString.endsWith('[]')) {
            return {
                type: 'TSArrayType',
                elementType: this.parseTypeString(typeString.slice(0, -2))
            };
        }
        
        if (typeString.includes('|')) {
            return {
                type: 'TSUnionType',
                types: typeString.split('|').map(t => this.parseTypeString(t.trim()))
            };
        }
        
        // Object or function type
        return {
            type: 'TSTypeReference',
            typeName: { type: 'Identifier', name: typeString }
        };
    }

    isComplexObject(node) {
        return node.properties.length > 2 || 
               node.properties.some(prop => 
                   prop.value?.type === 'ObjectExpression' || 
                   prop.value?.type === 'ArrayExpression'
               );
    }
}

class TranspilerCLI {
    constructor() {
        this.transpiler = new JSToTSTranspiler();
    }

    async run() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            this.showHelp();
            return;
        }

        const options = this.parseArgs(args);
        
        try {
            if (options.directory) {
                await this.transpileDirectory(options.directory, options);
            } else if (options.input && options.output) {
                await this.transpiler.transpile(options.input, options.output);
            } else {
                await this.transpileDefault();
            }
        } catch (error) {
            console.error('❌ Transpilation failed:', error.message);
            process.exit(1);
        }
    }

    parseArgs(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            switch (arg) {
                case '-i':
                case '--input':
                    options.input = args[++i];
                    break;
                case '-o':
                case '--output':
                    options.output = args[++i];
                    break;
                case '-d':
                case '--directory':
                    options.directory = args[++i];
                    break;
                case '--strict':
                    options.strictMode = true;
                    break;
                case '--no-infer':
                    options.inferTypes = false;
                    break;
                case '--no-interfaces':
                    options.generateInterfaces = false;
                    break;
                case '--explicit-any':
                    options.addExplicitAny = true;
                    break;
                case '-h':
                case '--help':
                    this.showHelp();
                    process.exit(0);
                    break;
            }
        }
        
        return options;
    }

    async transpileDefault() {
        const inputFile = 'input.js';
        const outputFile = 'output.ts';
        
        try {
            await fs.access(inputFile);
            await this.transpiler.transpile(inputFile, outputFile);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`❌ Input file '${inputFile}' not found. Please create it or specify custom paths.`);
            } else {
                throw error;
            }
        }
    }

    async transpileDirectory(dirPath, options) {
        const files = await fs.readdir(dirPath);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        console.log(`🔄 Transpiling ${jsFiles.length} JavaScript files...`);
        
        for (const file of jsFiles) {
            const inputPath = path.join(dirPath, file);
            const outputPath = path.join(dirPath, file.replace('.js', '.ts'));
            
            const transpiler = new JSToTSTranspiler(options);
            await transpiler.transpile(inputPath, outputPath);
        }
        
        console.log(`✅ Successfully transpiled all files in ${dirPath}`);
    }

    showHelp() {
        console.log(`
🚀 JavaScript to TypeScript Transpiler

USAGE:
  node transpiler.js [OPTIONS]

OPTIONS:
  -i, --input <file>      Input JavaScript file
  -o, --output <file>     Output TypeScript file
  -d, --directory <dir>   Transpile all .js files in directory
  --strict                Enable strict mode
  --no-infer             Disable type inference
  --no-interfaces        Don't generate interfaces
  --explicit-any         Add explicit 'any' types
  -h, --help             Show this help

EXAMPLES:
  node transpiler.js                           # Transpile input.js to output.ts
  node transpiler.js -i app.js -o app.ts      # Transpile specific files
  node transpiler.js -d ./src --strict        # Transpile directory in strict mode
        `);
    }
}

// Export for use as module
module.exports = {
    JSToTSTranspiler,
    TypeInferrer,
    InterfaceGenerator,
    TranspilerCLI
};

// Run CLI if executed directly
if (require.main === module) {
    const cli = new TranspilerCLI();
    cli.run().catch(console.error);
}