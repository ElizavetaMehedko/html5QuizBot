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
CORS(app, resources={r"/api-/.*/": {"origins": "*"}})

# Загрузка переменных окружenia
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')
TOKEN = os.getenv('TOKEN')
GROUP_CHAT_ID = os.getenv('GROUP_CHAT_ID')
SERVER_URL = os.getenv('SERVER_URL')
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
    cursor.execute('SELECT id, name FROM players')
    players = [{'id': row[0], 'name': row[1]} for row in cursor.fetchall()]
    cursor.close()
    return players

# Обработчики команд
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
        bot.reply_to(message, "Бот запущен. База данных очищена. Используйте /registration для начала.")
    elif message.text == '/start':
        bot.reply_to(message, "Бот активен. Ожидайте команды администратора.")
    elif message.text == '/registration' and str(message.chat.id) == ADMIN_CHAT_ID:
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("📝 Зарегистрироваться", callback_data="register"))
        msg = bot.send_message(GROUP_CHAT_ID, "Нажмите кнопку для регистрации:", reply_markup=markup)
        registration_message_id = msg.message_id
        bot.send_message(ADMIN_CHAT_ID, f"Registration message sent to {GROUP_CHAT_ID} with message_id {msg.message_id}\nЗавершайте регистрацию командой /endregistration")
    elif message.text == '/registration':
        bot.reply_to(message, "Только администратор может начать регистрацию.")
    elif message.text == '/endregistration' and str(message.chat.id) == ADMIN_CHAT_ID:
        if registration_message_id:
            try:
                bot.delete_message(GROUP_CHAT_ID, registration_message_id)
                app.logger.info(f"Deleted registration message {registration_message_id}")
            except Exception as e:
                app.logger.error(f"Error deleting message: {str(e)}")
        bot.send_message(GROUP_CHAT_ID, "Счастливых Вам голодных игр, и пусть удача всегда будет с Вами!")
        # Уведомление админу
        players = get_registered_players()
        if players:
            player_list = "\n".join([f"{p['name']} (ID: {p['id']})" for p in players])
            bot.send_message(ADMIN_CHAT_ID, f"Регистрация завершена!\nЗарегистрированные игроки:\n{player_list}\nЗапустите игру командой /play")
        else:
            bot.send_message(ADMIN_CHAT_ID, "Регистрация завершена, но никто не зарегистрировался.\nЗапустите игру командой /play, если хотите продолжить.")
    elif message.text == '/endregistration':
        bot.reply_to(message, "Только администратор может завершить регистрацию.")
    elif message.text == '/play' and str(message.chat.id) == ADMIN_CHAT_ID:
        # Создание кнопок с WebApp
        markup_group = types.InlineKeyboardMarkup()
        web_app_info = types.WebAppInfo(url=WEBAPP_URL)
        markup_group.add(types.InlineKeyboardButton(text="🎮 Играть", web_app=web_app_info))

        markup_admin = types.InlineKeyboardMarkup()
        markup_admin.add(types.InlineKeyboardButton(text="🎮 Начать игру (Админ)", web_app=web_app_info))

        try:
            bot.send_message(GROUP_CHAT_ID, "Игра началась! Нажмите, чтобы присоединиться:", reply_markup=markup_group)
            bot.send_message(ADMIN_CHAT_ID, "Игра запущена для группы. Ожидайте игроков.", reply_markup=markup_admin)
            app.logger.debug(f"Sent messages with WebApp URL: {WEBAPP_URL}")
        except telebot.apihelper.ApiTelegramException as e:
            app.logger.error(f"Telegram API Error: {str(e)}")
            bot.send_message(ADMIN_CHAT_ID, f"Ошибка при отправке сообщений: {str(e)}")
    elif message.text == '/play':
        bot.reply_to(message, "Только администратор может начать игру.")

# Обработчик коллбэков
def handle_callback_query(callback_query):
    app.logger.info(f"Received callback from {callback_query.from_user.id}: {callback_query.data}")
    if callback_query.data == "register":
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
                bot.answer_callback_query(callback_query.id, "Регистрация успешна!")
                bot.send_message(ADMIN_CHAT_ID, f"Пользователь {name} (ID: {user_id}) зарегистрировался.")
            else:
                bot.answer_callback_query(callback_query.id, "Вы уже зарегистрированы!")
            cursor.close()
        except Exception as e:
            app.logger.error(f"Error registering user {user_id}: {str(e)}")
            bot.answer_callback_query(callback_query.id, "Ошибка регистрации!")

# Регистрация вебхука
WEBHOOK_URL = f"{SERVER_URL}/{TOKEN}"
@app.route(f'/{TOKEN}', methods=['POST'])
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

# API-эндпоинты
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    user_id = data.get('user_id')
    name = data.get('name')
    if not user_id or not name:
        return jsonify({'status': 'error', 'message': 'Missing user_id or name'}), 400
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM players WHERE id = %s', (user_id,))
    player = cursor.fetchone()
    if not player:
        cursor.execute('INSERT INTO players (id, name) VALUES (%s, %s)', (user_id, name))
        db.commit()
    cursor.close()
    return jsonify({'status': 'success'})

@app.route('/api/start_tour', methods=['POST'])
def start_tour():
    data = request.json
    mode = data.get('mode')
    name = data.get('name')
    user_id = data.get('user_id')
    if not mode or not name:
        app.logger.error(f"Invalid request data: mode={mode}, name={name}")
        return jsonify({'status': 'error', 'message': 'Missing mode or name'}), 400
    if not user_id:
        app.logger.error("Missing user_id")
        return jsonify({'status': 'error', 'message': 'Missing user_id'}), 400
    try:
        if str(user_id) != ADMIN_CHAT_ID:
            app.logger.warning(f"Unauthorized attempt to start tour by user {user_id}")
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        db = get_db()
        cursor = db.cursor()
        cursor.execute('INSERT INTO tours (name, date, mode) VALUES (%s, %s, %s)', (name, '2025-03-17', mode))
        db.commit()
        tour_id = cursor.lastrowid
        cursor.close()
        app.logger.info(f"Tour started: id={tour_id}, name={name}, mode={mode}")
        return jsonify({'status': 'success', 'tour_id': tour_id})
    except Exception as e:
        app.logger.error(f"Error starting tour: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    data = request.json
    user_id = data.get('user_id')
    tour_id = data.get('tour_id')
    points = data.get('points', 0)
    answer = data.get('answer')
    if not user_id or not tour_id or answer is None:
        return jsonify({'status': 'error', 'message': 'Missing user_id, tour_id, or answer'}), 400
    db = get_db()
    cursor = db.cursor()
    cursor.execute('INSERT INTO results (player_id, tour_id, points, answer) VALUES (%s, %s, %s, %s)', (user_id, tour_id, points, answer))
    cursor.execute('UPDATE players SET total_points = total_points + %s WHERE id = %s', (points, user_id))
    db.commit()
    cursor.close()
    return jsonify({'status': 'success'})

@app.route('/api/end_tour', methods=['POST'])
def end_tour():
    data = request.json
    tour_id = data.get('tour_id')
    correct_answer = data.get('correct_answer')
    if not tour_id:
        return jsonify({'status': 'error', 'message': 'Missing tour_id'}), 400
    db = get_db()
    cursor = db.cursor()
    cursor.execute('UPDATE tours SET correct_answer = %s, status = %s WHERE id = %s', (correct_answer, 'finished', tour_id))
    # Обновление баллов игроков
    cursor.execute('SELECT player_id, answer FROM results WHERE tour_id = %s', (tour_id,))
    results = cursor.fetchall()
    for player_id, answer in results:
        points = 10 if answer == correct_answer else 0
        cursor.execute('UPDATE players SET total_points = total_points + %s WHERE id = %s', (points, player_id))
        cursor.execute('UPDATE results SET points = %s WHERE tour_id = %s AND player_id = %s', (points, tour_id, player_id))
    db.commit()
    cursor.close()
    return jsonify({'status': 'success'})

@app.route('/api/current_tour', methods=['GET'])
def current_tour():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, mode FROM tours WHERE status = %s LIMIT 1', ('active',))
    tour = cursor.fetchone()
    cursor.close()
    if tour:
        return jsonify({'id': tour[0], 'name': tour[1], 'mode': tour[2], 'status': 'active'})
    return jsonify({'id': None})

@app.route('/api/tour_answers', methods=['GET'])
def tour_answers():
    tour_id = request.args.get('tour_id')
    if not tour_id:
        return jsonify({'status': 'error', 'message': 'Missing tour_id'}), 400
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT p.name, r.answer FROM results r JOIN players p ON r.player_id = p.id WHERE r.tour_id = %s', (tour_id,))
    answers = [{'name': row[0], 'answer': row[1]} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({'answers': answers})

@app.route('/api/tour_results', methods=['GET'])
def tour_results():
    tour_id = request.args.get('tour_id')
    if not tour_id:
        return jsonify({'status': 'error', 'message': 'Missing tour_id'}), 400
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT p.id, p.name, r.answer, r.points FROM results r JOIN players p ON r.player_id = p.id WHERE r.tour_id = %s', (tour_id,))
    results = [{'user_id': row[0], 'name': row[1], 'answer': row[2], 'points': row[3]} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({'results': results})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, total_points FROM players ORDER BY total_points DESC')
    leaderboard = [{'id': row[0], 'name': row[1], 'total_points': row[2] or 0} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({'leaderboard': leaderboard})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 10000)))