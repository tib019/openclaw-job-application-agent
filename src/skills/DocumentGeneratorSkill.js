/**
 * DocumentGeneratorSkill
 * 
 * Generates customized application documents for each job posting:
 * - Cover letter (Anschreiben) - dynamically generated, unique for each application
 * - Resume (Lebenslauf) - reordered and highlighted based on job requirements
 * - Optional: Portfolio selection from GitHub projects
 * 
 * Uses LLM for creative content generation and template-based structure.
 * Analyzes user's GitHub repositories to select best project references.
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');
const PDFDocument = require('pdfkit');
const GitHubService = require('../services/GitHubService');

class DocumentGeneratorSkill {
    constructor(config) {
        this.config = config;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.githubService = null;
        this.userProfile = null;
    }

    /**
     * Initialize and load user profile
     */
    async initialize() {
        // Load user profile from config
        const profilePath = '/app/config/user_profile.json';
        const profileData = await fs.readFile(profilePath, 'utf8');
        this.userProfile = JSON.parse(profileData);
        
        // Initialize GitHub Service
        this.githubService = new GitHubService({
            githubUsername: this.userProfile.github?.username || this.userProfile.personal?.github || 'tibo47-161',
            githubToken: process.env.GITHUB_TOKEN
        });
        await this.githubService.initialize();
        
 console.log(`Loaded user profile: ${this.userProfile.personal?.name || this.userProfile.name}`);
    }

    /**
     * Generate complete application package
     * 
     * @param {Object} jobData - Parsed job posting data
     * @returns {Object} Generated documents and metadata
     */
    async generateApplication(jobData) {
 console.log(`Generating application for: ${jobData.company} - ${jobData.position}`);

        try {
            // Step 1: Analyze GitHub repos and select best project
            const bestProject = await this.selectBestGitHubProject(jobData);

            // Step 2: Generate cover letter
            const coverLetter = await this.generateCoverLetter(jobData, bestProject);

            // Step 3: Generate customized resume
            const resume = await this.generateResume(jobData);

            // Step 4: Save documents to filesystem
            const outputDir = await this.createApplicationFolder(jobData);
            await this.saveCoverLetter(coverLetter, outputDir);
            await this.saveResume(resume, outputDir);
            await this.saveMetadata(jobData, bestProject, outputDir);

 console.log(`Application package generated in: ${outputDir}`);

            return {
                coverLetterPath: path.join(outputDir, 'anschreiben.pdf'),
                resumePath: path.join(outputDir, 'lebenslauf.pdf'),
                metadataPath: path.join(outputDir, 'metadata.json'),
                outputDir
            };

        } catch (error) {
 console.error(`Error generating application:`, error);
            throw error;
        }
    }

    /**
     * Analyze GitHub repositories and select best project for this job
     */
    async selectBestGitHubProject(jobData) {
 console.log('Analyzing GitHub repositories...');

        try {
            // Use GitHubService to find matching projects
            const jobRequirements = {
                skills: jobData.requiredSkills || [],
                position: jobData.position || '',
                description: jobData.description || ''
            };

            // Get top 3 matching projects
            const maxProjects = this.userProfile.github?.maxProjectsPerApplication || 3;
            const matchingProjects = await this.githubService.findMatchingProjects(
                jobRequirements,
                maxProjects
            );

            if (matchingProjects.length === 0) {
 console.warn(' No matching projects found, using fallback');
                return {
                    name: 'automated-trading-system',
                    reason: 'Fallback project - demonstrates coding skills',
                    highlightPoints: ['Demonstrates coding skills', 'Shows problem-solving ability'],
                    url: 'https://github.com/tibo47-161/automated-trading-system',
                    matchScore: 0
                };
            }

            // Return the best matching project
            const bestProject = matchingProjects[0];
            
 console.log(`Selected project: ${bestProject.name} (Score: ${bestProject.matchScore})`);

            return {
                name: bestProject.name,
                description: bestProject.description,
                url: bestProject.url,
                language: bestProject.language,
                technologies: bestProject.technologies,
                matchScore: bestProject.matchScore,
                reason: `Best match with score ${bestProject.matchScore}/100`,
                highlightPoints: [
                    `Uses ${bestProject.language} and ${bestProject.technologies.slice(0, 2).join(', ')}`,
                    bestProject.description || 'Demonstrates practical coding skills',
                    `${bestProject.stars} stars on GitHub`
                ].filter(Boolean),
                allMatchingProjects: matchingProjects // Include all for reference
            };

        } catch (error) {
 console.error(' GitHub analysis failed:', error.message);
            return {
                name: 'automated-trading-system',
                reason: 'Fallback project - error during analysis',
                highlightPoints: ['Demonstrates coding skills'],
                url: 'https://github.com/tibo47-161/automated-trading-system',
                matchScore: 0
            };
        }
    }

    /**
     * Generate customized cover letter
     */
    async generateCoverLetter(jobData, bestProject) {
 console.log(' Generating cover letter...');

        const prompt = `Write a professional German cover letter (Anschreiben) for this job application.

Applicant Profile:
- Name: ${this.userProfile.name}
- Current Position: QA Engineer bei Hosenso (seit 2 Wochen)
- Background: Abgeschlossene Umschulung zum Fachinformatiker für Anwendungsentwicklung (FIAE)
- Skills: Java, HTML, CSS, JavaScript, MySQL, Python (mit Zertifikat), QA Testing, Agile/Scrum
- Internship: 6 Monate bei Argo Aviation GmbH (IT-Administration, Active Directory, Helpdesk, Agile)
- Certificates: Python Entry Level, Scrum Foundation (geplant für Sommer 2026)

Job Details:
- Company: ${jobData.company}
- Position: ${jobData.position}
- Required Skills: ${jobData.requiredSkills?.join(', ') || 'Not specified'}
- Culture Signals: ${jobData.cultureSigns?.join(', ') || 'Not specified'}
- Location: ${jobData.location || 'Not specified'}

Best Project to Highlight:
- Project: ${bestProject.selectedProject}
- Reason: ${bestProject.reason}
- Highlight Points: ${bestProject.highlightPoints.join(', ')}
- URL: ${bestProject.url}

Requirements:
1. Write in fluent, authentic German (not AI-sounding)
2. Start with a unique, engaging opening paragraph that references something specific about the company or position
3. Highlight the MOST RELEVANT 3-5 skills for THIS specific job
4. Mention the GitHub project naturally in context
5. Show enthusiasm for the company/position
6. Keep it concise (max 1 page)
7. Use modern, professional tone (not overly formal)
8. Include proper German business letter structure

Return ONLY the cover letter text in Markdown format with proper structure:
- Date
- Company address
- Subject line
- Salutation
- Body paragraphs
- Closing`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are an expert German application writer who creates authentic, non-generic cover letters.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });

        return response.choices[0].message.content;
    }

    /**
     * Generate customized resume
     */
    async generateResume(jobData) {
 console.log('Generating resume...');

        // Read master resume template
        const masterResumePath = '/host/dokumente/Lebenslauf_Master.md';
        let masterResume;
        
        try {
            masterResume = await fs.readFile(masterResumePath, 'utf8');
        } catch (error) {
 console.warn(' Master resume not found, using default template');
            masterResume = this.getDefaultResumeTemplate();
        }

        const prompt = `Customize this resume for the specific job posting. Reorder skills and experiences to highlight the most relevant ones first.

Master Resume:
${masterResume}

Job Details:
- Position: ${jobData.position}
- Required Skills: ${jobData.requiredSkills?.join(', ') || 'Not specified'}
- Experience Level: ${jobData.experienceLevel || 'Not specified'}

Instructions:
1. Keep all factual information unchanged
2. Reorder the "Skills" section to put the most relevant skills first
3. Emphasize relevant experiences (e.g., QA work for testing roles, Argo Aviation internship for IT admin roles)
4. Add a brief "Profile" section at the top that matches the job requirements
5. Keep it to 2 pages maximum
6. Return in Markdown format

Return the customized resume in Markdown.`;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are an expert resume optimizer.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content;
    }

    /**
     * Create application folder with timestamp and company name
     */
    async createApplicationFolder(jobData) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const companySlug = jobData.company.replace(/[^a-zA-Z0-9]/g, '_');
        const positionSlug = jobData.position.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        
        const folderName = `${timestamp}_${companySlug}_${positionSlug}`;
        const folderPath = path.join('/host/bewerbungen', folderName);

        await fs.mkdir(folderPath, { recursive: true });
 console.log(`Created folder: ${folderPath}`);

        return folderPath;
    }

    /**
     * Save cover letter as PDF
     */
    async saveCoverLetter(markdown, outputDir) {
        const pdfPath = path.join(outputDir, 'anschreiben.pdf');
        const mdPath = path.join(outputDir, 'anschreiben.md');

        // Save markdown version
        await fs.writeFile(mdPath, markdown, 'utf8');

        // Convert to PDF (simplified - would use proper PDF generation library)
        const doc = new PDFDocument();
        const stream = require('fs').createWriteStream(pdfPath);
        doc.pipe(stream);
        doc.fontSize(11).text(markdown, {
            align: 'left'
        });
        doc.end();

        await new Promise(resolve => stream.on('finish', resolve));
 console.log(`Saved cover letter: ${pdfPath}`);
    }

    /**
     * Save resume as PDF
     */
    async saveResume(markdown, outputDir) {
        const pdfPath = path.join(outputDir, 'lebenslauf.pdf');
        const mdPath = path.join(outputDir, 'lebenslauf.md');

        // Save markdown version
        await fs.writeFile(mdPath, markdown, 'utf8');

        // Convert to PDF
        const doc = new PDFDocument();
        const stream = require('fs').createWriteStream(pdfPath);
        doc.pipe(stream);
        doc.fontSize(11).text(markdown, {
            align: 'left'
        });
        doc.end();

        await new Promise(resolve => stream.on('finish', resolve));
 console.log(`Saved resume: ${pdfPath}`);
    }

    /**
     * Save metadata
     */
    async saveMetadata(jobData, bestProject, outputDir) {
        const metadata = {
            generatedAt: new Date().toISOString(),
            jobData,
            selectedProject: bestProject,
            userProfile: {
                name: this.userProfile.name,
                currentPosition: this.userProfile.currentPosition
            }
        };

        const metadataPath = path.join(outputDir, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
 console.log(`Saved metadata: ${metadataPath}`);
    }

    /**
     * Default resume template (fallback)
     */
    getDefaultResumeTemplate() {
        return `# Lebenslauf

## Persönliche Daten
- Name: [Name aus Profil]
- Aktuell: QA Engineer bei Hosenso

## Berufserfahrung
### QA Engineer | Hosenso | seit Jan 2026
- Qualitätssicherung und Testing

### Praktikum | Argo Aviation GmbH | Mai - Nov 2025
- IT-Administration, Active Directory, Helpdesk

## Ausbildung
### Umschulung Fachinformatiker Anwendungsentwicklung
IHK | 2024 - 2026

## Skills
- Java, HTML, CSS, JavaScript
- MySQL, Python
- QA Testing, Agile/Scrum

## Zertifikate
- Python Entry Level Certificate
- Scrum Foundation (geplant)`;
    }
}

module.exports = DocumentGeneratorSkill;
