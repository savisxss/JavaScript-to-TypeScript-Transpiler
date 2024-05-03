const fs = require('fs');
const acorn = require('acorn');
const walk = require('acorn-walk');
const { Parser } = require('acorn');
const { default: generate } = require('astring');

// Function transpiling JavaScript code to TypeScript
function transpileToTypeScript(jsCode) {
    const ast = acorn.parse(jsCode, { ecmaVersion: 2020 });

    // Traverse the syntax tree
    walk.simple(ast, {
        VariableDeclaration(node) {
            if (node.kind === 'let' || node.kind === 'const' || node.kind === 'var') {
                // Add "any" type declarations to variables
                node.declarations.forEach(declaration => {
                    declaration.init = {
                        type: 'TSAnyKeyword',
                        start: declaration.start,
                        end: declaration.start,
                        loc: declaration.loc
                    };
                });
            }
        },
        FunctionDeclaration(node) {
            // Add "any" type declarations to function parameters
            node.params.forEach(param => {
                param.typeAnnotation = {
                    type: 'TypeAnnotation',
                    typeAnnotation: {
                        type: 'TSAnyKeyword',
                        start: param.start,
                        end: param.start,
                        loc: param.loc
                    },
                    start: param.start,
                    end: param.start,
                    loc: param.loc
                };
            });
        },
        ClassDeclaration(node) {
            // Add "any" type declarations to class properties
            node.body.body.forEach(classMember => {
                if (classMember.type === 'MethodDefinition') {
                    // Add "any" type to method parameters
                    classMember.value.params.forEach(param => {
                        param.typeAnnotation = {
                            type: 'TypeAnnotation',
                            typeAnnotation: {
                                type: 'TSAnyKeyword',
                                start: param.start,
                                end: param.start,
                                loc: param.loc
                            },
                            start: param.start,
                            end: param.start,
                            loc: param.loc
                        };
                    });
                }
            });
        },
        FunctionTypeAnnotation(node) {
            // Add "any" type to generic function parameters
            node.parameters.forEach(param => {
                param.typeAnnotation = {
                    type: 'TSTypeAnnotation',
                    typeAnnotation: {
                        type: 'TSAnyKeyword',
                        start: param.start,
                        end: param.start,
                        loc: param.loc
                    },
                    start: param.start,
                    end: param.start,
                    loc: param.loc
                };
            });
        },
        InterfaceDeclaration(node) {
            // Convert JavaScript objects to TypeScript interfaces
            node.body.properties.forEach(property => {
                if (property.type === 'Property') {
                    property.type = 'TSPropertySignature';
                    property.optional = false;
                    property.initializer = null;
                }
            });
        },
        JSDocument(node) {
            // Convert JSDoc comments to TypeScript comments
            node.comments.forEach(comment => {
                comment.type = 'Line';
            });
        }
    });

    // Generate TypeScript code
    return generate(ast);
}

// Read the JavaScript file
fs.readFile('input.js', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Transpile JavaScript code to TypeScript
    const tsCode = transpileToTypeScript(data);

    // Write the transpiled TypeScript code to file
    fs.writeFile('output.ts', tsCode, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Code has been transpiled to TypeScript and saved to output.ts');
    });
});
