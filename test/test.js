const { JSToTSTranspiler, TypeInferrer } = require('../transpiler');
const fs = require('fs').promises;
const path = require('path');

class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async runAll() {
        console.log('🧪 Running transpiler tests...\n');

        for (const test of this.tests) {
            try {
                await test.testFn();
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name}: ${error.message}`);
            }
            this.results.total++;
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 Test Results:');
        console.log(`   Passed: ${this.results.passed}`);
        console.log(`   Failed: ${this.results.failed}`);
        console.log(`   Total:  ${this.results.total}`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed');
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertContains(text, substring, message) {
        if (!text.includes(substring)) {
            throw new Error(message || `Text does not contain "${substring}"`);
        }
    }
}

const runner = new TestRunner();

// Test type inferrer
runner.addTest('Type Inferrer - Basic Types', () => {
    const inferrer = new TypeInferrer();
    
    runner.assertEquals(
        inferrer.inferType({ type: 'Literal', value: 'hello' }),
        'string'
    );
    
    runner.assertEquals(
        inferrer.inferType({ type: 'Literal', value: 42 }),
        'number'
    );
    
    runner.assertEquals(
        inferrer.inferType({ type: 'Literal', value: true }),
        'boolean'
    );
});

runner.addTest('Type Inferrer - Array Types', () => {
    const inferrer = new TypeInferrer();
    
    const arrayNode = {
        type: 'ArrayExpression',
        elements: [
            { type: 'Literal', value: 1 },
            { type: 'Literal', value: 2 },
            { type: 'Literal', value: 3 }
        ]
    };
    
    runner.assertEquals(
        inferrer.inferType(arrayNode),
        'number[]'
    );
});

runner.addTest('Type Inferrer - Mixed Array Types', () => {
    const inferrer = new TypeInferrer();
    
    const mixedArrayNode = {
        type: 'ArrayExpression',
        elements: [
            { type: 'Literal', value: 1 },
            { type: 'Literal', value: 'hello' },
            { type: 'Literal', value: true }
        ]
    };
    
    runner.assertEquals(
        inferrer.inferType(mixedArrayNode),
        '(number | string | boolean)[]'
    );
});

runner.addTest('Transpiler - Basic Configuration', () => {
    const transpiler = new JSToTSTranspiler({
        strictMode: true,
        inferTypes: true,
        generateInterfaces: false
    });
    
    runner.assert(transpiler.options.strictMode, 'Strict mode should be enabled');
    runner.assert(transpiler.options.inferTypes, 'Type inference should be enabled');
    runner.assert(!transpiler.options.generateInterfaces, 'Interface generation should be disabled');
});

runner.addTest('Transpiler - Simple Code Transpilation', () => {
    const transpiler = new JSToTSTranspiler({
        inferTypes: true,
        generateInterfaces: false
    });
    
    const jsCode = `
        const message = "Hello World";
        const count = 42;
        const isActive = true;
    `;
    
    const result = transpiler.transpileCode(jsCode);
    
    runner.assertContains(result, 'const message', 'Should contain message variable');
    runner.assertContains(result, 'const count', 'Should contain count variable');
    runner.assertContains(result, 'const isActive', 'Should contain isActive variable');
});

runner.addTest('Transpiler - Function Parameter Types', () => {
    const transpiler = new JSToTSTranspiler({
        inferTypes: true,
        addExplicitAny: true
    });
    
    const jsCode = `
        function add(a, b) {
            return a + b;
        }
    `;
    
    const result = transpiler.transpileCode(jsCode);
    runner.assertContains(result, 'function add', 'Should contain function declaration');
});

runner.addTest('Interface Generator - Basic Interface', () => {
    const transpiler = new JSToTSTranspiler({
        generateInterfaces: true
    });
    
    runner.assert(transpiler.interfaceGenerator, 'Interface generator should exist');
    
    const interfaceName = transpiler.interfaceGenerator.generateInterface(
        '{ name: string; age: number }'
    );
    
    runner.assertEquals(interfaceName, 'Interface1', 'Should generate numbered interface name');
});

runner.addTest('File Operations - Create Test Files', async () => {
    const testDir = path.join(__dirname, 'temp');
    
    try {
        await fs.mkdir(testDir, { recursive: true });
        
        const testJS = `
            const user = { name: "Test", age: 25 };
            function greet(name) {
                return "Hello " + name;
            }
        `;
        
        const inputPath = path.join(testDir, 'test-input.js');
        const outputPath = path.join(testDir, 'test-output.ts');
        
        await fs.writeFile(inputPath, testJS);
        
        const transpiler = new JSToTSTranspiler();
        await transpiler.transpile(inputPath, outputPath);
        
        const output = await fs.readFile(outputPath, 'utf8');
        runner.assertContains(output, 'const user', 'Output should contain user variable');
        
        // Cleanup
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
        await fs.rmdir(testDir);
        
    } catch (error) {
        throw new Error(`File operations failed: ${error.message}`);
    }
});

runner.addTest('Error Handling - Invalid JavaScript', () => {
    const transpiler = new JSToTSTranspiler();
    
    const invalidJS = `
        const invalid = {
            unclosed: "string
        };
    `;
    
    try {
        transpiler.transpileCode(invalidJS);
        runner.assert(false, 'Should have thrown an error for invalid JavaScript');
    } catch (error) {
        runner.assertContains(error.message, 'Parse error', 'Should contain parse error message');
    }
});

runner.addTest('Complex Object Type Inference', () => {
    const transpiler = new JSToTSTranspiler({
        generateInterfaces: true,
        inferTypes: true
    });
    
    const jsCode = `
        const complexObject = {
            id: 123,
            name: "Test",
            settings: {
                theme: "dark",
                enabled: true
            },
            items: [1, 2, 3]
        };
    `;
    
    const result = transpiler.transpileCode(jsCode);
    
    runner.assertContains(result, 'interface', 'Should generate interfaces');
    runner.assertContains(result, 'complexObject', 'Should contain the variable');
});

// Run all tests
if (require.main === module) {
    runner.runAll().catch(console.error);
}

module.exports = TestRunner;