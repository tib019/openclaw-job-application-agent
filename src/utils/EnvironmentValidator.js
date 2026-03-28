/**
 * Environment Validator
 * 
 * Validates environment variables and system requirements before startup.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const fs = require('fs').promises;
const path = require('path');

class EnvironmentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Validate all requirements
     */
    async validate() {
 console.log('Validating environment...\n');

        await this.validateNodeVersion();
        await this.validateRequiredEnvVars();
        await this.validateOptionalEnvVars();
        await this.validateDirectories();
        await this.validateConfigFiles();
        await this.validateDependencies();

        this.printResults();

        if (this.errors.length > 0) {
            throw new Error(`Environment validation failed with ${this.errors.length} error(s)`);
        }

 console.log('\n Environment validation passed!\n');
        return true;
    }

    /**
     * Validate Node.js version
     */
    async validateNodeVersion() {
        const requiredVersion = 22;
        const currentVersion = parseInt(process.version.slice(1).split('.')[0]);

        if (currentVersion < requiredVersion) {
            this.errors.push(`Node.js version ${requiredVersion}+ required, found ${currentVersion}`);
        } else {
 console.log(`Node.js version: ${process.version}`);
        }
    }

    /**
     * Validate required environment variables
     */
    async validateRequiredEnvVars() {
        const required = [
            'OPENAI_API_KEY',
            'GITHUB_TOKEN',
            'TELEGRAM_BOT_TOKEN',
            'TELEGRAM_CHAT_ID',
            'EMAIL_ADDRESS',
            'EMAIL_PASSWORD'
        ];

        for (const envVar of required) {
            if (!process.env[envVar]) {
                this.errors.push(`Missing required environment variable: ${envVar}`);
            } else {
                const maskedValue = this._maskValue(process.env[envVar]);
 console.log(`${envVar}: ${maskedValue}`);
            }
        }
    }

    /**
     * Validate optional environment variables
     */
    async validateOptionalEnvVars() {
        const optional = [
            'LINKEDIN_EMAIL',
            'LINKEDIN_PASSWORD',
            'LOG_LEVEL',
            'MAX_RETRIES'
        ];

        for (const envVar of optional) {
            if (!process.env[envVar]) {
                this.warnings.push(`Optional environment variable not set: ${envVar}`);
            } else {
                const maskedValue = this._maskValue(process.env[envVar]);
 console.log(`${envVar}: ${maskedValue}`);
            }
        }
    }

    /**
     * Validate required directories
     */
    async validateDirectories() {
        const directories = [
            '/app/config',
            '/app/data',
            '/app/logs',
            '/home/ubuntu/Bewerbungen'
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
 console.log(`Directory exists: ${dir}`);
            } catch (error) {
                this.warnings.push(`Directory missing: ${dir} (will be created)`);
                try {
                    await fs.mkdir(dir, { recursive: true });
 console.log(`Created directory: ${dir}`);
                } catch (createError) {
                    this.errors.push(`Failed to create directory: ${dir}`);
                }
            }
        }
    }

    /**
     * Validate config files
     */
    async validateConfigFiles() {
        const configFiles = [
            {
                path: '/app/config/user_profile.json',
                required: true
            },
            {
                path: '/app/config/search_criteria.json',
                required: false
            },
            {
                path: '/app/config/settings.json',
                required: false
            }
        ];

        for (const { path: filePath, required } of configFiles) {
            try {
                await fs.access(filePath);
                
                // Try to parse JSON
                const content = await fs.readFile(filePath, 'utf8');
                JSON.parse(content);
                
 console.log(`Config file valid: ${filePath}`);
            } catch (error) {
                if (required) {
                    this.errors.push(`Required config file missing or invalid: ${filePath}`);
                } else {
                    this.warnings.push(`Optional config file missing: ${filePath}`);
                }
            }
        }
    }

    /**
     * Validate dependencies
     */
    async validateDependencies() {
        const dependencies = [
            'express',
            'openai',
            '@octokit/rest',
            'selenium-webdriver',
            'nodemailer'
        ];

        for (const dep of dependencies) {
            try {
                require.resolve(dep);
 console.log(`Dependency installed: ${dep}`);
            } catch (error) {
                this.errors.push(`Missing dependency: ${dep}`);
            }
        }
    }

    /**
     * Print validation results
     */
    printResults() {
 console.log('\n Validation Summary:\n');

        if (this.errors.length > 0) {
 console.log('Errors:');
            this.errors.forEach(error => console.log(`- ${error}`));
            console.log('');
        }

        if (this.warnings.length > 0) {
 console.log(' Warnings:');
            this.warnings.forEach(warning => console.log(`- ${warning}`));
            console.log('');
        }

        if (this.errors.length === 0 && this.warnings.length === 0) {
 console.log('No issues found!');
        }
    }

    /**
     * Mask sensitive values
     */
    _maskValue(value) {
        if (!value) return 'not set';
        if (value.length <= 8) return '****';
        return value.slice(0, 4) + '****' + value.slice(-4);
    }

    /**
     * Get validation report
     */
    getReport() {
        return {
            passed: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = EnvironmentValidator;
