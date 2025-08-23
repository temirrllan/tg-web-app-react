const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const db = require('../config/database');

class ReminderService {
  constructor(bot) {
    this.bot = bot;
    this.tasks = new Map();
  }

  start() {
    console.log('🔔 Starting reminder service...');
    
    // Проверяем напоминания каждую минуту
    cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    });
    
    console.log('✅ Reminder service started');
  }

  async checkAndSendReminders() {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
      const currentDay = now.getDay() || 7; // 0 (Sunday) = 7
      
      // Получаем все привычки с напоминаниями на текущее время
      const result = await db.query(
        `SELECT h.*, u.telegram_id, u.first_name, u.language
         FROM habits h
         JOIN users u ON h.user_id = u.id
         WHERE h.reminder_enabled = true
         AND h.reminder_time = $1
         AND h.is_active = true
         AND $2 = ANY(h.schedule_days)`,
        [currentTime, currentDay]
      );
      
      // Отправляем напоминания
      for (const habit of result.rows) {
        await this.sendReminder(habit);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async sendReminder(habit) {
    try {
      const chatId = habit.telegram_id;
      const lang = habit.language || 'en';
      
      const message = lang === 'ru' 
        ? `🔔 Напоминание!\n\n⏰ Время для: ${habit.title}\n💪 Цель: ${habit.goal}`
        : `🔔 Reminder!\n\n⏰ Time for: ${habit.title}\n💪 Goal: ${habit.goal}`;
      
      const keyboard = {
        inline_keyboard: [[
          { text: '✅ Done', callback_data: `mark_done_${habit.id}` },
          { text: '❌ Skip', callback_data: `mark_skip_${habit.id}` }
        ]]
      };
      
      await this.bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
      });
      
      // Сохраняем в историю
      await db.query(
        'INSERT INTO reminder_history (habit_id, sent_at) VALUES ($1, NOW())',
        [habit.id]
      );
      
      console.log(`📤 Reminder sent for habit ${habit.id} to user ${chatId}`);
    } catch (error) {
      console.error(`Failed to send reminder for habit ${habit.id}:`, error);
    }
  }

  stop() {
    // Останавливаем все задачи
    this.tasks.forEach(task => task.stop());
    this.tasks.clear();
    console.log('🛑 Reminder service stopped');
  }
}

module.exports = ReminderService;