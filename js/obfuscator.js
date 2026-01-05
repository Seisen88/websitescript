// Lua Obfuscator Logic
// Note: This is a client-side simulation. For production use, you would need to:
// 1. Set up a backend server with Prometheus installed
// 2. Send code to the server for obfuscation
// 3. Return the obfuscated result

class LuaObfuscator {
    constructor() {
        this.presets = {
            minify: {
                name: 'Minify',
                description: 'Basic minification, removes whitespace and comments'
            },
            weak: {
                name: 'Weak',
                description: 'Light obfuscation with variable renaming'
            },
            medium: {
                name: 'Medium',
                description: 'Moderate obfuscation with control flow changes'
            },
            strong: {
                name: 'Strong',
                description: 'Heavy obfuscation with multiple layers'
            }
        };
    }

    // Call backend API for obfuscation
    async obfuscate(code, version, preset) {
        const apiUrl = window.API_CONFIG?.baseUrl || 'http://localhost:3000';
        const timeout = window.API_CONFIG?.timeout || 60000;
        const enableFallback = window.API_CONFIG?.enableFallback !== false;

        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // Make API request
            const response = await fetch(`${apiUrl}/api/obfuscate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    version: version,
                    preset: preset
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Parse response
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }

            if (!data.success || !data.obfuscatedCode) {
                throw new Error('Invalid response from server');
            }

            return data.obfuscatedCode;

        } catch (error) {
            // Check if fallback should be used
            const shouldFallback = enableFallback && (
                error.name === 'AbortError' || 
                error.message.includes('fetch') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('Server error') ||
                error.message.includes('Obfuscation failed')
            );

            if (shouldFallback) {
                console.warn('Backend error or unavailable, using fallback simulation.');
                return this.simulateObfuscation(code, version, preset);
            }

            console.error('API Error:', error);

            // Re-throw the error with helpful message
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - obfuscation took too long');
            } else if (error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Make sure the server is running on ' + apiUrl);
            } else {
                throw error;
            }
        }
    }

    // DEMO: Simple simulation for demonstration purposes
    // Replace this with actual Prometheus API integration
    simulateObfuscation(code, version, preset) {
        if (!code || code.trim() === '') {
            throw new Error('No code provided');
        }

        // This is just a demonstration
        // In production, you would send this to your backend:
        /*
        const response = await fetch('/api/obfuscate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                version: version,
                preset: preset
            })
        });
        return await response.json();
        */

        // Demo obfuscation (just for UI demonstration)
        let result = `-- Obfuscated with Prometheus (${version.toUpperCase()}, ${preset} preset)\n`;
        result += `-- Original code length: ${code.length} characters\n\n`;
        
        // Simple variable name obfuscation for demo
        const lines = code.split('\n');
        const obfuscatedLines = lines.map(line => {
            if (line.trim().startsWith('--')) return ''; // Remove comments
            
            // Simple transformations for demo
            let obfLine = line
                .replace(/local\s+function\s+(\w+)/g, 'local function _0x$1')
                .replace(/function\s+(\w+)/g, 'function _0x$1')
                .replace(/local\s+(\w+)/g, 'local _0x$1')
                .replace(/print/g, '_G["print"]')
                .replace(/\s+/g, ' '); // Minify spaces
            
            return obfLine;
        }).filter(line => line.trim() !== '');

        result += obfuscatedLines.join('\n');
        
        result += `\n\n--[[\n`;
        result += `  DEMO MODE: This is a client-side simulation.\n`;
        result += `  For actual obfuscation, use the backend server.\n`;
        result += `  Join our Discord for support: https://discord.gg/F4sAf6z8Ph\n`;
        result += `--]]`;

        return result;
    }

    // Get preset information
    getPresetInfo(preset) {
        return this.presets[preset] || this.presets.medium;
    }
}

// Export for use in main.js
window.LuaObfuscator = LuaObfuscator;
