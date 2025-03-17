from flask import Flask, request, jsonify, g
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv
import logging
import telebot
from telebot import types

# Создание экземпляра Flask
app = Flask(__name__)

# Настройка логирования
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
app.logger.debug("Starting Flask server...")

# Настройка CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Загрузка переменных окружения
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')
TOKEN = os.getenv('TOKEN')
GROUP_CHAT_ID = os.getenv('GROUP_CHAT_ID')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://html5-quiz-bot.vercel.app')

# Инициализация бота
bot = telebot.TeleBot(TOKEN)
app.logger.info("Bot initialized with token")

# Глобальная переменная для хранения message_id
registration_message_id = None

def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(DATABASE_URL)
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

app.teardown_appcontext(close_db)

# Инициализация базы данных
with app.app_context():
    db = get_db()
    cursor = db.cursor()
    with app.open_resource('schema.sql', mode='r') as f:
        sql_script = f.read()
        commands = [cmd.strip() for cmd in sql_script.split(';') if cmd.strip()]
        for cmd in commands:
            cursor.execute(cmd)
    db.commit()
    cursor.close()

# Получение списка зарегистрированных игроков
def get_registered_players():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT name FROM players')
    players = [row[0] for row in cursor.fetchall()]
    cursor.close()
    return players

# Обработчик команд
def handle_message(message):
    global registration_message_id
    app.logger.info(f"Received message from {message.chat.id}: {message.text}")
    if message.text == '/start' and str(message.chat.id) == ADMIN_CHAT_ID:
        try:
            db = get_db()
            cursor = db.cursor()
            cursor.execute('DELETE FROM players')
            cursor.execute('DELETE FROM tours')
            cursor.execute('DELETE FROM results')
            db.commit()
            app.logger.info("Database cleared")
        except Exception as e:
            app.logger.error(f"Error clearing database: {str(e)}")
        
        # Отправка сообщения с кнопкой сразу в группу и админу
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton(
            text="🎮 Присоединиться к игре",
            url=f"{WEBAPP_URL}?role=player",
            callback_data="register_player"
        ))
        msg = bot.send_message(GROUP_CHAT_ID, "Игра началась! Нажмите, чтобы присоединиться:", reply_markup=markup)
        bot.send_message(ADMIN_CHAT_ID, "Игра запущена. Ждите игроков.", reply_markup=markup.copy())
        registration_message_id = msg.message_id
    elif message.text == '/start':
        bot.reply_to(message, "Бот активен. Ожидайте команды администратора.")

# Обработчик коллбэков (регистрация игроков)
def handle_callback_query(callback_query):
    app.logger.info(f"Received callback from {callback_query.from_user.id}: {callback_query.data}")
    if callback_query.data == "register_player":
        user_id = callback_query.from_user.id
        name = callback_query.from_user.first_name or "Unknown"
        try:
            db = get_db()
            cursor = db.cursor()
            cursor.execute('SELECT * FROM players WHERE id = %s', (user_id,))
            player = cursor.fetchone()
            if not player:
                cursor.execute('INSERT INTO players (id, name) VALUES (%s, %s)', (user_id, name))
                db.commit()
                bot.answer_callback_query(callback_query.id, "Регистрация успешна! Вы переадресованы в игру.")
                # Перенаправление в Web App
                bot.send_message(callback_query.from_user.id, "Перейдите в игру:", reply_markup=types.InlineKeyboardMarkup().add(
                    types.InlineKeyboardButton(text="🎮 Играть", url=f"{WEBAPP_URL}?role=player")
                ))
            else:
                bot.answer_callback_query(callback_query.id, "Вы уже зарегистрированы! Перейдите в игру.")
                bot.send_message(callback_query.from_user.id, "Перейдите в игру:", reply_markup=types.InlineKeyboardMarkup().add(
                    types.InlineKeyboardButton(text="🎮 Играть", url=f"{WEBAPP_URL}?role=player")
                ))
            cursor.close()
        except Exception as e:
            app.logger.error(f"Error registering user {user_id}: {str(e)}")
            bot.answer_callback_query(callback_query.id, "Ошибка регистрации!")

# Регистрация вебхука
WEBHOOK_URL = f"{os.getenv('SERVER_URL')}/webhook"
@app.route('/webhook', methods=['POST'])
def webhook():
    app.logger.info("Webhook received")
    json_string = request.get_data().decode('utf-8')
    app.logger.debug(f"Webhook data: {json_string}")
    update = telebot.types.Update.de_json(json_string)
    if update and update.message:
        handle_message(update.message)
    if update and update.callback_query:
        handle_callback_query(update.callback_query)
    return '', 200

# Установка вебхука при старте
with app.app_context():
    bot.remove_webhook()
    bot.set_webhook(url=WEBHOOK_URL)
    app.logger.info(f"Webhook set to {WEBHOOK_URL}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 10000)))