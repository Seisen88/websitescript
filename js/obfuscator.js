// Obfuscator API Handler
class ObfuscatorAPI {
    constructor() {
        this.config = window.API_CONFIG || {
            baseUrl: 'http://localhost:3000',
            timeout: 10000,
            enableFallback: false
        };
    }

    async obfuscate(code, version, preset) {
        if (!code || code.trim() === '') {
            throw new Error('No code provided');
        }

        // Always use backend - no fallback
        return await this.obfuscateWithBackend(code, version, preset);
    }

    async obfuscateWithBackend(code, version, preset) {
        const apiUrl = `${this.config.baseUrl}/api/obfuscate`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(apiUrl, {
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Backend error response:', errorData);
                const errorMsg = errorData.details || errorData.error || `Backend error: ${response.status}`;
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            if (!data.obfuscated) {
                throw new Error('Invalid response from backend');
            }

            return data.obfuscated;

        } catch (error) {
            // Log error for debugging
            console.error('Obfuscation error:', error);

            // Re-throw the error with helpful message
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - obfuscation took too long. Try splitting your code into smaller chunks.');
            } else if (error.message.includes('fetch')) {
                throw new Error('Cannot connect to backend server. Please check your internet connection.');
            } else if (error.message.includes('Obfuscation failed')) {
                // Show the actual backend error
                throw new Error(`Backend error: ${error.message}\n\nThis might be because:\n- Your code is too large for the free tier\n- Prometheus found a syntax error\n- The server is out of memory\n\nTry using smaller code or check the console for details.`);
            } else {
                throw error;
            }
        }
    }

    // Get preset information
    getPresetInfo(preset) {
        const presets = {
            minify: {
                name: 'Minify',
                description: 'Basic minification - removes whitespace and comments',
                features: ['Whitespace removal', 'Comment stripping', 'Basic compression']
            },
            weak: {
                name: 'Weak',
                description: 'Light obfuscation with minimal performance impact',
                features: ['Variable renaming', 'String encoding', 'Control flow flattening']
            },
            medium: {
                name: 'Medium',
                description: 'Balanced obfuscation with good protection',
                features: ['Advanced renaming', 'String encryption', 'Control flow obfuscation', 'Dead code injection']
            },
            strong: {
                name: 'Strong',
                description: 'Maximum obfuscation for critical code',
                features: ['Heavy obfuscation', 'VM protection', 'Anti-debug', 'Constant encryption']
            }
        };

        return presets[preset] || presets.medium;
    }
}

// Export for use in other scripts
window.ObfuscatorAPI = ObfuscatorAPI;
