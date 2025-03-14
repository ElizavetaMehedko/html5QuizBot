from dotenv import load_dotenv
import telebot
from telebot import types
import requests
import logging
import os

# Загрузка переменных из .env
load_dotenv()

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Получение и валидация токена
TOKEN = os.getenv('TOKEN')
if not TOKEN or ':' not in TOKEN:
    logger.error("Invalid or missing TOKEN. Please check .env file.")
    raise ValueError("TOKEN must contain a colon and be valid.")

# Получение и валидация chat IDs
GROUP_CHAT_ID = os.getenv('GROUP_CHAT_ID')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')

if not GROUP_CHAT_ID or not ADMIN_CHAT_ID:
    logger.error("Missing GROUP_CHAT_ID or ADMIN_CHAT_ID. Please check .env file.")
    raise ValueError("GROUP_CHAT_ID and ADMIN_CHAT_ID must be set in .env.")

try:
    GROUP_CHAT_ID = int(GROUP_CHAT_ID)
    ADMIN_CHAT_ID = int(ADMIN_CHAT_ID)
except ValueError:
    logger.error("GROUP_CHAT_ID and ADMIN_CHAT_ID must be valid integers.")
    raise ValueError("GROUP_CHAT_ID and ADMIN_CHAT_ID must be valid integers.")

GAME_URL = 'https://html5-quiz-bot.vercel.app'  # Базовый URL приложения
WEBAPP_SHORT_NAME = 'liza_quiz'  # Зарегистрированное имя в BotFather
WEBAPP_URL = f'https://t.me/html5QuizBot/{WEBAPP_SHORT_NAME}'  # Ссылка для открытия WebApp
SERVER_URL = 'http://localhost:5000'

bot = telebot.TeleBot(TOKEN)
logger.info(f"Bot initialized with username: {bot.get_me().username}")

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

    try:
        markup = types.InlineKeyboardMarkup()
        play_button = types.InlineKeyboardButton("🎮 Играть", url=WEBAPP_URL)
        markup.add(play_button)
        bot.send_message(GROUP_CHAT_ID, "🎉 *Игра начата! Нажмите, чтобы играть:*", reply_markup=markup, parse_mode='Markdown')
        logger.info(f"Play button sent to group with URL: {WEBAPP_URL}")
        bot.send_message(ADMIN_CHAT_ID, "🎉 *Игра начата! Нажмите, чтобы управлять игрой:*", reply_markup=markup, parse_mode='Markdown')
        logger.info(f"Play button sent to admin {ADMIN_CHAT_ID}")
    except Exception as e:
        logger.error(f"Failed to send play button: {e}")
        bot.send_message(ADMIN_CHAT_ID, f"❌ Ошибка при отправке кнопки Играть: {str(e)}. Проверьте логи.")

if __name__ == '__main__':
    logger.info("Bot started polling")
    bot.polling(none_stop=True)