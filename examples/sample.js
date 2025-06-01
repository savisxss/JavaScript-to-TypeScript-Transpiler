// Sample JavaScript file for transpilation testing

// Simple variable declarations with type inference
const userName = "Alice Johnson";
const userAge = 28;
const isActive = true;
const scores = [95, 87, 92, 88];
const mixedArray = [1, "hello", true, null];

// Object with nested structure
const userProfile = {
    id: 12345,
    name: "Alice Johnson",
    email: "alice@example.com",
    settings: {
        theme: "dark",
        language: "en",
        notifications: {
            email: true,
            push: false,
            sms: true
        }
    },
    tags: ["premium", "verified", "early-adopter"],
    metadata: {
        createdAt: "2023-01-15",
        lastLogin: "2024-03-20",
        loginCount: 247
    }
};

// Function with parameter type inference
function calculateDiscount(price, discountPercent, membershipLevel) {
    if (membershipLevel === "premium") {
        discountPercent += 10;
    }
    
    const discountAmount = price * (discountPercent / 100);
    return price - discountAmount;
}

// Arrow function with array processing
const processScores = (scores) => {
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    
    return {
        average: average,
        highest: highest,
        lowest: lowest,
        total: scores.length
    };
};

// Function with complex return type
function getUserData(userId) {
    if (userId <= 0) {
        return null;
    }
    
    const userData = {
        id: userId,
        profile: userProfile,
        stats: processScores(scores),
        permissions: ["read", "write", "delete"]
    };
    
    return userData;
}

// Class with various member types
class DataManager {
    constructor(apiUrl, timeout) {
        this.apiUrl = apiUrl;
        this.timeout = timeout || 5000;
        this.cache = new Map();
        this.requestCount = 0;
        this.isConnected = false;
    }
    
    async fetchData(endpoint, params) {
        this.requestCount++;
        
        const cacheKey = endpoint + JSON.stringify(params);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const url = this.apiUrl + endpoint;
        const response = await fetch(url, {
            method: 'GET',
            timeout: this.timeout,
            params: params
        });
        
        const data = await response.json();
        this.cache.set(cacheKey, data);
        
        return data;
    }
    
    clearCache() {
        this.cache.clear();
        console.log("Cache cleared");
    }
    
    getStats() {
        return {
            requests: this.requestCount,
            cacheSize: this.cache.size,
            connected: this.isConnected
        };
    }
}

// Factory function pattern
function createApiClient(config) {
    const client = new DataManager(config.url, config.timeout);
    
    return {
        get: (endpoint) => client.fetchData(endpoint, {}),
        post: (endpoint, data) => client.fetchData(endpoint, data),
        stats: () => client.getStats(),
        clear: () => client.clearCache()
    };
}

// Higher-order function
function withRetry(fn, maxAttempts) {
    return async function(...args) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                lastError = error;
                if (attempt === maxAttempts) {
                    throw lastError;
                }
                
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };
}

// Array processing with chaining
function analyzeData(dataset) {
    return dataset
        .filter(item => item.status === "active")
        .map(item => ({
            id: item.id,
            value: item.value * 1.2,
            category: item.category || "default"
        }))
        .reduce((groups, item) => {
            const key = item.category;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
}

// Event handler pattern
function setupEventHandlers() {
    const handlers = {
        click: (event) => {
            console.log("Clicked:", event.target.id);
            return true;
        },
        keypress: (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                return false;
            }
            return true;
        },
        resize: (event) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            console.log(`Window resized: ${width}x${height}`);
        }
    };
    
    return handlers;
}

// Module exports pattern
const api = createApiClient({
    url: "https://api.example.com/v1/",
    timeout: 10000
});

const retryableFetch = withRetry(api.get, 3);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateDiscount,
        processScores,
        getUserData,
        DataManager,
        createApiClient,
        withRetry,
        analyzeData,
        setupEventHandlers
    };
}