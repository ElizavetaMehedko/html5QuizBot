from flask import Flask, request, jsonify, g
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv
import logging
import telebot

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
SERVER_URL = os.getenv('SERVER_URL')

# Инициализация бота
bot = telebot.TeleBot(TOKEN)

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

# Обработчики команд бота
@bot.message_handler(commands=['start'])
def handle_start(message):
    app.logger.info(f"Received /start from {message.chat.id}")
    bot.reply_to(message, "Бот запущен. Используйте /registration для начала.")

@bot.message_handler(commands=['registration'])
def handle_registration(message):
    user_id = message.from_user.id
    name = message.from_user.first_name
    app.logger.info(f"Registration attempt from {user_id}")
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT * FROM players WHERE id = %s', (user_id,))
        if not cursor.fetchone():
            cursor.execute('INSERT INTO players (id, name) VALUES (%s, %s)', (user_id, name))
            db.commit()
            bot.reply_to(message, "Вы зарегистрированы!")
        else:
            bot.reply_to(message, "Вы уже зарегистрированы!")
        cursor.close()
    except Exception as e:
        app.logger.error(f"Registration error: {str(e)}")
        bot.reply_to(message, f"Ошибка регистрации: {str(e)}")

# Отладочный обработчик для всех сообщений
@bot.message_handler(func=lambda message: True)
def debug_message(message):
    app.logger.debug(f"Received message: {message.text}, from chat: {message.chat.id}")

# Регистрация вебхука
WEBHOOK_URL = f"{SERVER_URL}/webhook"
@app.route('/webhook', methods=['POST'])
def webhook():
    app.logger.info("Webhook received")
    json_string = request.get_data().decode('utf-8')
    app.logger.debug(f"Webhook data: {json_string}")
    update = telebot.types.Update.de_json(json_string)
    if update and update.message:
        app.logger.debug(f"Update contains message: {update.message.text}")
        bot.process_new_updates([update])
    else:
        app.logger.warning("No message in update")
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
        # Проверяем, является ли пользователь админом
        if str(user_id) != ADMIN_CHAT_ID:
            app.logger.warning(f"Unauthorized attempt to start tour by user {user_id}")
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        db = get_db()
        cursor = db.cursor()
        cursor.execute('INSERT INTO tours (name, date, mode) VALUES (%s, %s, %s)', (name, '2025-03-15', mode))
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
    db.commit()
    cursor.close()
    return jsonify({'status': 'success'})

@app.route('/api/end_tour', methods=['POST'])
def end_tour():
    data = request.json
    tour_id = data.get('tour_id')
    correct_answer = data.get('correct_answer')
    if not tour_id or correct_answer is None:
        return jsonify({'status': 'error', 'message': 'Missing tour_id or correct_answer'}), 400
    db = get_db()
    cursor = db.cursor()
    cursor.execute('UPDATE tours SET correct_answer = %s, status = %s WHERE id = %s', (correct_answer, 'finished', tour_id))
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
    cursor.execute('SELECT p.name, r.answer, r.points FROM results r JOIN players p ON r.player_id = p.id WHERE r.tour_id = %s', (tour_id,))
    results = [{'name': row[0], 'answer': row[1], 'points': row[2]} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({'results': results})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, name, total_points FROM players ORDER BY total_points DESC')
    leaderboard = [{'id': row[0], 'name': row[1], 'total_points': row[2]} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({'leaderboard': leaderboard})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))