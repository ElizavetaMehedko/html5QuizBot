import telebot
from telebot import types
import requests
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

TOKEN = 'YOUR_TOKEN'  # Замените на ваш токен
GROUP_CHAT_ID = -1002133226949  # Замените на ваш GROUP_CHAT_ID
ADMIN_CHAT_ID = 167509764  # ID админа
GAME_URL = 'https://html5-quiz-bot.vercel.app'  # Базовый URL игры
SERVER_URL = 'http://localhost:5000'  # URL сервера

bot = telebot.TeleBot(TOKEN)
group_messages = []

@bot.message_handler(commands=['start'])
def start(message):
    chat_id = message.chat.id
    if chat_id == ADMIN_CHAT_ID:
        bot.send_message(chat_id, '🌟 *База данных очищена!*', parse_mode='Markdown')

    markup = types.ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    markup.add(types.KeyboardButton('/registration'), types.KeyboardButton('/endregistration'), types.KeyboardButton('/play'))
    bot.send_message(chat_id, '👋 *Привет! Используй команды или приложение для игры.*', reply_markup=markup, parse_mode='Markdown')

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
    logger.info(f"Registration message sent to {GROUP_CHAT_ID} with message_id {sent_message.message_id}")
    bot.send_message(ADMIN_CHAT_ID, "✅ *Кнопка регистрации отправлена в группу!*", parse_mode='Markdown')

@bot.callback_query_handler(func=lambda call: call.data == 'register')
def handle_registration(call):
    user_id = call.from_user.id
    user_name = call.from_user.first_name
    logger.info(f"Callback received from user {user_id} ({user_name})")
    if call.from_user.is_bot:
        bot.answer_callback_query(call.id, "🤖 Боты не могут участвовать!")
        return

    try:
        response = requests.post(f'{SERVER_URL}/api/register', json={'user_id': user_id, 'name': user_name})
        response.raise_for_status()
        logger.info(f"Registration successful for user {user_id}")
        bot.answer_callback_query(call.id, f"✅ {user_name}, вы в игре!")
        bot.send_message(ADMIN_CHAT_ID, f'🔔 *Новый участник: {user_name} (ID: {user_id})*', parse_mode='Markdown')
    except requests.RequestException as e:
        logger.error(f"Failed to register user {user_id}: {e}")
        bot.answer_callback_query(call.id, "❌ Ошибка регистрации. Попробуйте позже.")

@bot.message_handler(commands=['endregistration'])
def end_registration(message):
    if message.chat.id != ADMIN_CHAT_ID:
        bot.send_message(message.chat.id, "🚫 *Команда только для админа!*", parse_mode='Markdown')
        return

    for msg_id in group_messages[:]:
        try:
            bot.delete_message(GROUP_CHAT_ID, msg_id)
            logger.info(f"Deleted message {msg_id} from {GROUP_CHAT_ID}")
        except Exception as e:
            logger.warning(f"Не удалось удалить сообщение {msg_id}: {e}")
    group_messages.clear()
    bot.send_message(GROUP_CHAT_ID, "Счастливых Вам голодных игр, и пусть удача всегда будет с Вами!")
    logger.info("Registration ended successfully")

@bot.message_handler(commands=['play'])
def send_play_button(message):
    if message.chat.id != ADMIN_CHAT_ID:
        bot.send_message(message.chat.id, "🚫 *Команда только для админа!*", parse_mode='Markdown')
        return

    # Создаем URL для WebApp с параметром startapp
    webapp_url = f"https://t.me/{bot.get_me().username}?startapp=1"
    markup = types.InlineKeyboardMarkup()
    play_button = types.InlineKeyboardButton("🎮 Играть", url=webapp_url)
    markup.add(play_button)
    bot.send_message(GROUP_CHAT_ID, "🎉 *Тур начат! Нажмите, чтобы играть:*", reply_markup=markup, parse_mode='Markdown')
    logger.info("Play button sent to group")
    
    # Сообщение для админа с WebApp URL
    admin_message = f"✅ *Тур начат! Перейдите к управлению игрой:* [Играть]({webapp_url})"
    bot.send_message(ADMIN_CHAT_ID, admin_message, parse_mode='Markdown', disable_web_page_preview=True)
    logger.info(f"Play link sent to admin {ADMIN_CHAT_ID}")

if __name__ == '__main__':
    logger.info("Bot started polling")
    bot.polling(none_stop=True)