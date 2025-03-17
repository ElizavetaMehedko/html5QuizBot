import telebot
import requests
import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()
TOKEN = os.getenv('TOKEN')
GROUP_CHAT_ID = os.getenv('GROUP_CHAT_ID')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')
SERVER_URL = os.getenv('SERVER_URL', 'https://telegram-quiz-game.onrender.com')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://html5-quiz-bot.vercel.app')

# Инициализация бота
bot = telebot.TeleBot(TOKEN)

# Обработчики команд
@bot.message_handler(commands=['start'])
def start(message):
    if str(message.chat.id) == ADMIN_CHAT_ID:
        bot.send_message(message.chat.id, "Бот запущен. Используйте /registration для начала.")
    else:
        bot.send_message(message.chat.id, "Бот активен. Ожидайте команды администратора.")

@bot.message_handler(commands=['registration'])
def registration(message):
    if str(message.chat.id) != ADMIN_CHAT_ID:
        bot.reply_to(message, "Только администратор может начать регистрацию.")
        return
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("📝 Зарегистрироваться", url=f"{WEBAPP_URL}"))
    msg = bot.send_message(GROUP_CHAT_ID, "Нажмите кнопку для регистрации:", reply_markup=markup)
    bot.send_message(ADMIN_CHAT_ID, f"Registration message sent to {GROUP_CHAT_ID} with message_id {msg.message_id}")

@bot.callback_query_handler(func=lambda call: call.data == "register")
def callback_register(call):
    user_id = call.from_user.id
    user_name = call.from_user.first_name or "Unknown"
    response = requests.post(f'{SERVER_URL}/api/register', json={'user_id': user_id, 'name': user_name})
    if response.status_code == 200:
        bot.answer_callback_query(call.id, "Регистрация успешна!")
    else:
        bot.answer_callback_query(call.id, "Ошибка регистрации!")

@bot.message_handler(commands=['endregistration'])
def end_registration(message):
    app.logger.info(f"Received /endregistration from {message.chat.id}")
    if str(message.chat.id) != ADMIN_CHAT_ID:
        bot.reply_to(message, "Только администратор может завершить регистрацию.")
        return
    bot.send_message(GROUP_CHAT_ID, "Счастливых Вам голодных игр, и пусть удача всегда будет с Вами!")

@bot.message_handler(commands=['play'])
def play(message):
    app.logger.info(f"Received /play from {message.chat.id}")
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(telebot.types.InlineKeyboardButton("🎮 Играть", url=f"{WEBAPP_URL}"))
    bot.send_message(GROUP_CHAT_ID, "Игра началась! Нажмите, чтобы присоединиться:", reply_markup=markup)
    bot.send_message(ADMIN_CHAT_ID, "Игра запущена для группы.")

# Запуск бота
if __name__ == "__main__":
    print("Bot started polling...")
    bot.polling(none_stop=True)