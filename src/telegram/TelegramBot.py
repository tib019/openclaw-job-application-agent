"""
Telegram Bot for Job Application Agent Remote Control

Provides command-based interface for:
- Viewing application queue status
- Approving/rejecting applications
- Triggering batch send operations
- Viewing statistics
- Manual job submission

Commands:
/start - Welcome message and help
/status - Show queue statistics
/list [status] - List applications by status
/view <id> - View application details
/approve <id> - Approve single application
/approveall - Approve all pending applications
/reject <id> - Reject application
/send - Send all approved applications
/stats - Detailed statistics
/help - Show all commands

@author Manus AI
@date 2026-02-07
"""

import os
import json
import logging
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters
)

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Agent Service API URL
AGENT_API_URL = os.getenv('AGENT_API_URL', 'http://agent-service:3000')


class JobApplicationBot:
    def __init__(self, token):
        self.token = token
        self.application = Application.builder().token(token).build()
        self._register_handlers()

    def _register_handlers(self):
        """Register all command and callback handlers"""
        self.application.add_handler(CommandHandler("start", self.cmd_start))
        self.application.add_handler(CommandHandler("status", self.cmd_status))
        self.application.add_handler(CommandHandler("list", self.cmd_list))
        self.application.add_handler(CommandHandler("view", self.cmd_view))
        self.application.add_handler(CommandHandler("approve", self.cmd_approve))
        self.application.add_handler(CommandHandler("approveall", self.cmd_approve_all))
        self.application.add_handler(CommandHandler("reject", self.cmd_reject))
        self.application.add_handler(CommandHandler("send", self.cmd_send))
        self.application.add_handler(CommandHandler("stats", self.cmd_stats))
        self.application.add_handler(CommandHandler("help", self.cmd_help))
        self.application.add_handler(CommandHandler("prompt", self.cmd_prompt))
        
        # Callback query handler for inline buttons
        self.application.add_handler(CallbackQueryHandler(self.handle_callback))

    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Welcome message"""
        welcome_text = """
🤖 **Job Application Agent**

Willkommen! Ich bin dein automatisierter Bewerbungsassistent.

Ich überwache deine Job-Alert-E-Mails, erstelle maßgeschneiderte Bewerbungen und sende sie auf dein Kommando.

**Hauptfunktionen:**
✅ Automatische Stellensuche
✅ Intelligente Dokumentenerstellung
✅ Batch-Versand auf Freigabe
✅ Vollständiges Tracking

Nutze /help um alle Befehle zu sehen.
Nutze /status für einen Überblick.
"""
        await update.message.reply_text(welcome_text, parse_mode='Markdown')

    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show queue status"""
        try:
            response = requests.get(f'{AGENT_API_URL}/api/queue/stats')
            stats = response.json()

            status_text = f"""
📊 **Queue Status**

📋 Gesamt: {stats['total']}
⏳ Pending: {stats['pending']}
✅ Approved: {stats['approved']}
📤 Sent: {stats['sent']}
❌ Failed: {stats['failed']}
🚫 Rejected: {stats['rejected']}

Nutze /list pending um ausstehende Bewerbungen zu sehen.
"""
            await update.message.reply_text(status_text, parse_mode='Markdown')

        except Exception as e:
            logger.error(f"Error fetching status: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen des Status.")

    async def cmd_list(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """List applications by status"""
        status = context.args[0] if context.args else 'PENDING_REVIEW'
        status = status.upper()

        try:
            response = requests.get(f'{AGENT_API_URL}/api/queue/list/{status}')
            applications = response.json()

            if not applications:
                await update.message.reply_text(f"📭 Keine Bewerbungen mit Status: {status}")
                return

            text = f"📋 **Bewerbungen ({status}):**\n\n"
            for app in applications[:10]:  # Limit to 10
                text += f"**#{app['id']}** {app['company']} - {app['position']}\n"
                text += f"   📅 {app['createdAt'][:10]}\n"
                text += f"   🔗 {app['url'][:50]}...\n\n"

            if len(applications) > 10:
                text += f"\n_(und {len(applications) - 10} weitere)_"

            await update.message.reply_text(text, parse_mode='Markdown')

        except Exception as e:
            logger.error(f"Error listing applications: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen der Liste.")

    async def cmd_view(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """View detailed application info"""
        if not context.args:
            await update.message.reply_text("❌ Bitte gib eine ID an: /view <id>")
            return

        app_id = int(context.args[0])

        try:
            response = requests.get(f'{AGENT_API_URL}/api/queue/get/{app_id}')
            app = response.json()

            if not app:
                await update.message.reply_text(f"❌ Bewerbung #{app_id} nicht gefunden.")
                return

            text = f"""
📄 **Bewerbung #{app['id']}**

🏢 **Firma:** {app['company']}
💼 **Position:** {app['position']}
📍 **Ort:** {app.get('location', 'N/A')}
📊 **Status:** {app['status']}

🔗 **URL:** {app['url']}

📅 **Erstellt:** {app['createdAt']}
🔄 **Aktualisiert:** {app['updatedAt']}

**Skills:** {', '.join(app.get('requiredSkills', []))}
**Match Score:** {app.get('matchScore', 'N/A')}/100
"""

            # Add action buttons
            keyboard = [
                [
                    InlineKeyboardButton("✅ Approve", callback_data=f"approve_{app_id}"),
                    InlineKeyboardButton("🚫 Reject", callback_data=f"reject_{app_id}")
                ],
                [InlineKeyboardButton("📂 Open Folder", callback_data=f"folder_{app_id}")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text(text, parse_mode='Markdown', reply_markup=reply_markup)

        except Exception as e:
            logger.error(f"Error viewing application: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen der Bewerbung.")

    async def cmd_approve(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Approve single application"""
        if not context.args:
            await update.message.reply_text("❌ Bitte gib eine ID an: /approve <id>")
            return

        app_id = int(context.args[0])

        try:
            response = requests.post(f'{AGENT_API_URL}/api/queue/approve/{app_id}')
            if response.status_code == 200:
                await update.message.reply_text(f"✅ Bewerbung #{app_id} wurde freigegeben!")
            else:
                await update.message.reply_text(f"❌ Fehler beim Freigeben von #{app_id}")

        except Exception as e:
            logger.error(f"Error approving application: {e}")
            await update.message.reply_text("❌ Fehler beim Freigeben.")

    async def cmd_approve_all(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Approve all pending applications"""
        try:
            response = requests.post(f'{AGENT_API_URL}/api/queue/approve-all')
            result = response.json()
            count = result.get('count', 0)

            await update.message.reply_text(f"✅ {count} Bewerbungen wurden freigegeben!")

        except Exception as e:
            logger.error(f"Error approving all: {e}")
            await update.message.reply_text("❌ Fehler beim Freigeben aller Bewerbungen.")

    async def cmd_reject(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Reject application"""
        if not context.args:
            await update.message.reply_text("❌ Bitte gib eine ID an: /reject <id>")
            return

        app_id = int(context.args[0])

        try:
            response = requests.post(f'{AGENT_API_URL}/api/queue/reject/{app_id}')
            if response.status_code == 200:
                await update.message.reply_text(f"🚫 Bewerbung #{app_id} wurde abgelehnt.")
            else:
                await update.message.reply_text(f"❌ Fehler beim Ablehnen von #{app_id}")

        except Exception as e:
            logger.error(f"Error rejecting application: {e}")
            await update.message.reply_text("❌ Fehler beim Ablehnen.")

    async def cmd_send(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Send all approved applications"""
        try:
            # Get count of approved applications
            response = requests.get(f'{AGENT_API_URL}/api/queue/stats')
            stats = response.json()
            approved_count = stats['approved']

            if approved_count == 0:
                await update.message.reply_text("📭 Keine freigegebenen Bewerbungen zum Versenden.")
                return

            # Confirmation
            keyboard = [
                [
                    InlineKeyboardButton("✅ Ja, senden!", callback_data="confirm_send"),
                    InlineKeyboardButton("❌ Abbrechen", callback_data="cancel_send")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text(
                f"📤 **Batch-Versand**\n\n{approved_count} Bewerbungen werden versendet.\n\nBist du sicher?",
                parse_mode='Markdown',
                reply_markup=reply_markup
            )

        except Exception as e:
            logger.error(f"Error initiating send: {e}")
            await update.message.reply_text("❌ Fehler beim Vorbereiten des Versands.")

    async def cmd_stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show detailed statistics"""
        try:
            response = requests.get(f'{AGENT_API_URL}/api/queue/stats/detailed')
            stats = response.json()

            text = f"""
📊 **Detaillierte Statistiken**

**Gesamt:** {stats['total']} Bewerbungen

**Status-Verteilung:**
⏳ Pending: {stats['pending']}
✅ Approved: {stats['approved']}
📤 Sent: {stats['sent']}
❌ Failed: {stats['failed']}
🚫 Rejected: {stats['rejected']}

**Letzte 30 Tage:**
📤 Versendet: {stats.get('sent_last_30_days', 0)}

**Erfolgsrate:** {stats.get('success_rate', 0)}%
"""
            await update.message.reply_text(text, parse_mode='Markdown')

        except Exception as e:
            logger.error(f"Error fetching detailed stats: {e}")
            await update.message.reply_text("❌ Fehler beim Abrufen der Statistiken.")

    async def cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show help message"""
        help_text = """
📖 **Verfügbare Befehle:**

**Status & Übersicht:**
/status - Queue-Status anzeigen
/stats - Detaillierte Statistiken
/list [status] - Bewerbungen nach Status auflisten

**Bewerbungen verwalten:**
/view <id> - Bewerbung im Detail ansehen
/approve <id> - Einzelne Bewerbung freigeben
/approveall - Alle ausstehenden Bewerbungen freigeben
/reject <id> - Bewerbung ablehnen

**Versand:**
/send - Alle freigegebenen Bewerbungen versenden

**Sonstiges:**
/help - Diese Hilfe anzeigen

**Beispiele:**
`/list pending` - Zeige ausstehende Bewerbungen
`/view 5` - Zeige Details zu Bewerbung #5
`/approve 5` - Gebe Bewerbung #5 frei
"""
        await update.message.reply_text(help_text, parse_mode='Markdown')

    async def handle_callback(self, query, context: ContextTypes.DEFAULT_TYPE):
        """Handle inline button callbacks"""
        data = query.data

        if data.startswith('approve_'):
            app_id = int(data.split('_')[1])
            response = requests.post(f'{AGENT_API_URL}/api/queue/approve/{app_id}')
            if response.status_code == 200:
                await query.answer("✅ Freigegeben!")
                await query.edit_message_text(f"✅ Bewerbung #{app_id} wurde freigegeben!")
            else:
                await query.answer("❌ Fehler")

        elif data.startswith('reject_'):
            app_id = int(data.split('_')[1])
            response = requests.post(f'{AGENT_API_URL}/api/queue/reject/{app_id}')
            if response.status_code == 200:
                await query.answer("🚫 Abgelehnt")
                await query.edit_message_text(f"🚫 Bewerbung #{app_id} wurde abgelehnt.")
            else:
                await query.answer("❌ Fehler")

        elif data == 'confirm_send':
            await query.answer("📤 Versende...")
            response = requests.post(f'{AGENT_API_URL}/api/queue/send-all')
            result = response.json()
            await query.edit_message_text(
                f"✅ {result.get('sent', 0)} Bewerbungen wurden versendet!\n"
                f"❌ {result.get('failed', 0)} fehlgeschlagen."
            )

        elif data == 'cancel_send':
            await query.answer("Abgebrochen")
            await query.edit_message_text("❌ Versand abgebrochen.")

    async def cmd_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Process natural language prompt via LLM"""
        if not context.args:
            await update.message.reply_text(
                "❌ Bitte gib eine Anweisung an.\n\n"
                "Beispiele:\n"
                "• `/prompt zeige alle bewerbungen mit score über 70`\n"
                "• `/prompt lehne alle bewerbungen mit score unter 60 ab`\n"
                "• `/prompt genehmige alle remote jobs`\n"
                "• `/prompt sende alle genehmigten bewerbungen`"
            )
            return

        prompt = ' '.join(context.args)
        
        await update.message.reply_text(f"🤖 Verarbeite: \"{prompt}\"...")

        try:
            # Call Prompt Service API (will be added to Agent API)
            response = requests.post(
                f'{AGENT_API_URL}/api/prompt/process',
                json={'prompt': prompt},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success'):
                    # Format response based on action
                    action = result.get('action', 'unknown')
                    data = result.get('result', {})
                    
                    if action == 'listApplicationsFiltered':
                        applications = data.get('applications', [])
                        count = data.get('count', 0)
                        
                        if count == 0:
                            await update.message.reply_text("📋 Keine passenden Bewerbungen gefunden.")
                        else:
                            text = f"📋 **{count} Bewerbungen gefunden:**\n\n"
                            for app in applications[:10]:  # Limit to 10
                                text += f"#{app['id']} - {app['company']} - {app['position']} (Score: {app.get('matchScore', 'N/A')})\n"
                            
                            if count > 10:
                                text += f"\n... und {count - 10} weitere"
                            
                            await update.message.reply_text(text, parse_mode='Markdown')
                    
                    elif action == 'approveBatch':
                        approved = data.get('approvedCount', 0)
                        await update.message.reply_text(f"✅ {approved} Bewerbungen genehmigt!")
                    
                    elif action == 'rejectBatch':
                        rejected = data.get('rejectedCount', 0)
                        await update.message.reply_text(f"🚫 {rejected} Bewerbungen abgelehnt!")
                    
                    elif action == 'sendAllApplications':
                        sent = data.get('sent', 0)
                        failed = data.get('failed', 0)
                        await update.message.reply_text(
                            f"✅ {sent} Bewerbungen versendet!\n"
                            f"❌ {failed} fehlgeschlagen."
                        )
                    
                    elif action == 'getStatistics':
                        stats = data.get('stats', {})
                        await update.message.reply_text(
                            f"📊 **Statistiken:**\n\n"
                            f"⏳ Pending: {stats.get('PENDING_REVIEW', 0)}\n"
                            f"✅ Approved: {stats.get('APPROVED', 0)}\n"
                            f"📤 Sent: {stats.get('SENT', 0)}\n"
                            f"🚫 Rejected: {stats.get('REJECTED', 0)}\n"
                            f"❌ Failed: {stats.get('FAILED', 0)}",
                            parse_mode='Markdown'
                        )
                    
                    elif action == 'approveApplication' or action == 'rejectApplication':
                        message = data.get('message', 'Aktion erfolgreich')
                        await update.message.reply_text(f"✅ {message}")
                    
                    else:
                        # Generic response
                        message = result.get('message', 'Aktion erfolgreich ausgeführt')
                        await update.message.reply_text(f"✅ {message}")
                else:
                    error = result.get('error', 'Unbekannter Fehler')
                    await update.message.reply_text(f"❌ Fehler: {error}")
            else:
                await update.message.reply_text(
                    f"❌ API-Fehler: {response.status_code}\n"
                    "Bitte versuche es später erneut."
                )
        
        except requests.exceptions.Timeout:
            await update.message.reply_text(
                "⏱️ Zeitüberschreitung. Die Anfrage dauert zu lange.\n"
                "Bitte versuche es mit einer einfacheren Anweisung."
            )
        except Exception as e:
            logger.error(f"Error in cmd_prompt: {e}")
            await update.message.reply_text(
                f"❌ Fehler bei der Verarbeitung: {str(e)}\n\n"
                "Bitte versuche es erneut oder nutze die Standard-Befehle."
            )

    def run(self):
        """Start the bot"""
        logger.info("🤖 Starting Telegram Bot...")
        self.application.run_polling()


if __name__ == '__main__':
    TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
    if not TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN environment variable not set!")

    bot = JobApplicationBot(TOKEN)
    bot.run()
