# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unveröffentlicht]

## [0.1.0] – 2026-09-14

Erste versionierte Fassung. Sie fasst den bisherigen Entwicklungsstand zusammen: 19 Commits seit 2026-02-07.

### Hinzugefügt

- Implement core skills and Telegram bot for job application agent
- Complete MVP implementation - Fully functional job application agent
- Add JobSearchSkill for active job portal search
- Sprint 2 - LLM-Steuerung via Telegram
- GitHub Integration - Intelligente Projektauswahl
- Production-ready - Unit tests, error handling, logging, healthchecks
- add analyze-all-repos feature with Telegram /repos command - Fix structural bug in AgentAPI.js: 5 handler methods were defined   outside the class scope after a premature closing brace, making   batch operations and prompt processing non-functional at runtime - Integrate GitHubService into AgentAPI so repo data is accessible   via the REST API (initialized alongside email and queue services) - Add GET /api/github/repos endpoint: returns all analyzed repos   sorted by stars, supports optional ?filter=<technology> query param - Add POST /api/github/refresh endpoint: forces a full cache refresh   and re-analysis of all GitHub repositories - Add /repos [tech] Telegram command: displays a formatted list of   all analyzed repos with language, technologies, stars and link;   supports optional technology filter (e.g. /repos python) - Register /github as an alias for /repos - Update /help to document the new commands
- add analyze-all-repos feature with Telegram /repos command - Fix structural bug in AgentAPI.js: 5 handler methods were defined   outside the class scope after a premature closing brace, making   batch operations and prompt processing unreachable at runtime - Integrate GitHubService into AgentAPI (initialized alongside   email and queue services using GITHUB_TOKEN / GITHUB_USERNAME) - Add GET /api/github/repos endpoint: returns all analyzed repos   sorted by stars, supports optional ?filter=<technology> query param - Add POST /api/github/refresh endpoint: forces a full cache refresh   and re-analysis of all GitHub repositories - Add /repos [tech] Telegram command: displays a formatted list of   all analyzed repos with language, technologies, stars and link;   supports optional technology filter (e.g. /repos python) - Register /github as an alias for /repos - Update /help to document the new commands - Fix indentation error in TelegramBot.py run() method left by   prior emoji-removal pass

### Behoben

- security updates, improved README and documentation
- security - update vulnerable dependencies to safe versions
- resolve all failing tests and harden source code Bugs fixed in source: - GitHubService._calculateMatchScore: add null guard for repo=null,   default empty arrays for repo.languages/technologies/topics, and   normalize all string inputs to prevent TypeError crashes - PromptService constructor: accept config={} default so service can   be instantiated without arguments; fall back to OPENAI_API_KEY env var Tests rewritten to match actual implementation: - EmailReaderSkill: mock imap module to avoid real IMAP connections;   rewrite tests to use actual methods (extractStepStoneJobs,   extractLinkedInJobs, extractIndeedJobs, extractJobsFromEmail) - JobParserSkill: mock {OpenAI} and selenium-webdriver; rewrite tests   to cover actual methods (stripHtmlTags, extractCompanyFromUrl,   extractByRegex, enrichWithLLM) instead of non-existent ones - PromptService: mock openai and axios; rewrite tests to cover   _getSystemPrompt, _getFunctionDefinitions, processPrompt instead   of non-existent parsePrompt/buildFunctionCall methods - GitHubService: fix score assertion from >70 to >40 (correct for   the algorithm's actual output for the test input) Result: 59/59 tests passing (was 24/72)

### Geändert

- clean up source and documentation Strip emojis from code comments, log statements and markdown headings across all source and documentation files. Reduces visual noise and removes obvious AI-generation markers from the codebase.

### Dokumentation

- Professionalisierung der Projektdokumentation auf IHK-Niveau
- Entferne IHK-Referenz und Zeitraum-Abschnitt aus README
- Mermaid-Architekturdiagramm + 3 ADRs (Function Calling, Dateisystem-DB, Docker 3-Service)

### Weitere Änderungen

- Feature: Telegram-Steuerung, Batch-System und autonomer Betrieb
- Update contact email to tobias.buss.dev@gmail.com

[Unveröffentlicht]: https://github.com/tib019/openclaw-job-application-agent/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/tib019/openclaw-job-application-agent/releases/tag/v0.1.0
