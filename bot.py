import telebot
from telebot import types
import requests
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

TOKEN = 'YOUR_TOKEN'  # Замените на ваш токен
GROUP_CHAT_ID = -1002133226949  # Замените на ваш GROUP_CHAT_ID
ADMIN_CHAT_ID = 167509764  # Замените на ваш ADMIN_CHAT_ID
GAME_URL = 'https://html5-quiz-bot.vercel.app'

bot = telebot.TeleBot(TOKEN)
group_messages = []

@bot.message_handler(commands=['start'])
def start(message):
    chat_id = message.chat.id
    if chat_id == ADMIN_CHAT_ID:
        bot.send_message(chat_id, '🌟 *База данных очищена!*', parse_mode='Markdown')

    markup = types.ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    markup.add(types.KeyboardButton('/registration'), types.KeyboardButton('/endregistration'))
    bot.send_message(chat_id, '👋 *Привет! Используй приложение для игры.*', reply_markup=markup, parse_mode='Markdown')

@bot.message_handler(commands=['registration'])
def registration(message):
    chat_id = message.chat.id
    if chat_id != ADMIN_CHAT_ID:
        bot.send_message(chat_id, "🚫 *Команда только для админа!*", parse_mode='Markdown')
        return

    markup = types.InlineKeyboardMarkup()
    registration_button = types.InlineKeyboardButton("📝 Зарегистрироваться", callback_data='register')
    markup.add(registration_button)
    sent_message = bot.send_message(GROUP_CHAT_ID, "🎉 *Нажмите, чтобы участвовать в квизе!*", reply_markup=markup, parse_mode='Markdown')
    group_messages.append(sent_message.message_id)
    bot.send_message(ADMIN_CHAT_ID, "✅ *Кнопка регистрации отправлена в группу!*", parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data == 'register')
def handle_registration(call):
    user_id = call.from_user.id
    user_name = call.from_user.first_name
    if call.from_user.is_bot:
        bot.answer_callback_query(call.id, "🤖 Боты не могут участвовать!")
        return

    requests.post('http://localhost:5000/api/register', json={'user_id': user_id, 'name': user_name})
    bot.answer_callback_query(call.id, f"✅ {user_name}, вы в игре!")
    bot.send_message(ADMIN_CHAT_ID, f'🔔 *Новый участник: {user_name} (ID: {user_id})*', parse_mode='Markdown')

@bot.message_handler(commands=['endregistration'])
def end_registration(message):
    if message.chat.id != ADMIN_CHAT_ID:
        bot.send_message(message.chat.id, "🚫 *Команда только для админа!*", parse_mode='Markdown')
        return

    for msg_id in group_messages[:]:
        try:
            bot.delete_message(GROUP_CHAT_ID, msg_id)
        except Exception as e:
            logging.warning(f"Не удалось удалить сообщение {msg_id}: {e}")
    group_messages.clear()
    bot.send_message(GROUP_CHAT_ID, "Счастливых Вам голодных игр, и пусть удача всегда будет с Вами!")

if __name__ == '__main__':
    bot.polling(none_stop=True)