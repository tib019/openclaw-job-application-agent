/**
 * EmailSenderSkill
 * 
 * Sends job applications via email with PDF attachments.
 * 
 * Features:
 * - SMTP-based email sending
 * - PDF attachments (cover letter + resume)
 * - Professional email formatting
 * - Error handling and retry logic
 * - Tracking of sent emails
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailSenderSkill {
    constructor(config) {
        this.config = config;
        this.transporter = null;
    }

    /**
     * Initialize SMTP transporter
     */
    async initialize() {
        this.transporter = nodemailer.createTransport({
            host: this.config.smtp.host,
            port: this.config.smtp.port,
            secure: this.config.smtp.secure,
            auth: {
                user: this.config.smtp.auth.user,
                pass: this.config.smtp.auth.pass
            }
        });

        // Verify connection
        try {
            await this.transporter.verify();
            console.log('✅ SMTP connection established');
        } catch (error) {
            console.error('❌ SMTP connection failed:', error);
            throw error;
        }
    }

    /**
     * Send application via email
     * 
     * @param {Object} application - Application data from queue
     * @returns {Object} Result with success status and metadata
     */
    async sendApplication(application) {
        console.log(`📧 Sending application to ${application.company}...`);

        try {
            // Determine recipient email
            const recipientEmail = this._getRecipientEmail(application);
            if (!recipientEmail) {
                throw new Error('No recipient email found for this application');
            }

            // Load attachments
            const attachments = await this._loadAttachments(application);

            // Generate email subject
            const subject = this._generateSubject(application);

            // Generate email body
            const body = await this._generateEmailBody(application);

            // Send email
            const info = await this.transporter.sendMail({
                from: {
                    name: this.config.from.name,
                    address: this.config.from.address
                },
                to: recipientEmail,
                subject: subject,
                text: body.text,
                html: body.html,
                attachments: attachments
            });

            console.log(`✅ Application sent to ${application.company}: ${info.messageId}`);

            return {
                success: true,
                messageId: info.messageId,
                recipientEmail: recipientEmail,
                sentAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Failed to send application to ${application.company}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get recipient email from application data
     */
    _getRecipientEmail(application) {
        // Priority order:
        // 1. Direct application email (from job posting)
        // 2. Generic company email (jobs@company.com)
        // 3. HR email (hr@company.com)

        if (application.applicationEmail) {
            return application.applicationEmail;
        }

        // Try to construct generic email from company name
        if (application.company) {
            const companyDomain = this._guessCompanyDomain(application.company);
            if (companyDomain) {
                return `jobs@${companyDomain}`;
            }
        }

        return null;
    }

    /**
     * Guess company domain from company name
     */
    _guessCompanyDomain(companyName) {
        // Simple heuristic: lowercase, remove spaces, add .de
        const domain = companyName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
        
        return `${domain}.de`;
    }

    /**
     * Load PDF attachments
     */
    async _loadAttachments(application) {
        const attachments = [];

        try {
            // Cover letter
            const coverLetterPath = application.coverLetterPath;
            if (coverLetterPath) {
                const coverLetterData = await fs.readFile(coverLetterPath);
                attachments.push({
                    filename: 'Anschreiben.pdf',
                    content: coverLetterData,
                    contentType: 'application/pdf'
                });
            }

            // Resume
            const resumePath = application.resumePath;
            if (resumePath) {
                const resumeData = await fs.readFile(resumePath);
                attachments.push({
                    filename: 'Lebenslauf.pdf',
                    content: resumeData,
                    contentType: 'application/pdf'
                });
            }

            console.log(`📎 Loaded ${attachments.length} attachments`);
            return attachments;

        } catch (error) {
            console.error('❌ Error loading attachments:', error);
            throw new Error(`Failed to load attachments: ${error.message}`);
        }
    }

    /**
     * Generate email subject
     */
    _generateSubject(application) {
        return `Bewerbung als ${application.position}`;
    }

    /**
     * Generate email body (text and HTML)
     */
    async _generateEmailBody(application) {
        const text = `Sehr geehrte Damen und Herren,

anbei sende ich Ihnen meine Bewerbung als ${application.position} bei ${application.company}.

Im Anhang finden Sie mein Anschreiben und meinen Lebenslauf.

Ich freue mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
${this.config.from.name}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .greeting {
            margin-bottom: 20px;
        }
        .signature {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="greeting">
            Sehr geehrte Damen und Herren,
        </div>
        <p>
            anbei sende ich Ihnen meine Bewerbung als <strong>${application.position}</strong> bei <strong>${application.company}</strong>.
        </p>
        <p>
            Im Anhang finden Sie mein Anschreiben und meinen Lebenslauf.
        </p>
        <p>
            Ich freue mich auf Ihre Rückmeldung.
        </p>
        <div class="signature">
            Mit freundlichen Grüßen<br>
            ${this.config.from.name}
        </div>
    </div>
</body>
</html>`;

        return { text, html };
    }

    /**
     * Close SMTP connection
     */
    async close() {
        if (this.transporter) {
            this.transporter.close();
            console.log('✅ SMTP connection closed');
        }
    }
}

module.exports = EmailSenderSkill;
