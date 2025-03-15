from flask import Flask, request, jsonify, g
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv
import logging


# Настройка логирования
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
app.logger.debug("Starting Flask server...")

CORS(app, resources={r"/api/*": {"origins": "*"}})

# Загрузка переменных окружения
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')  # Render предоставит эту переменную для Postgres
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')

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
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()

# API-эндпоинты
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    user_id = data.get('user_id')
    name = data.get('name')
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
    db = get_db()
    cursor = db.cursor()
    cursor.execute('INSERT INTO tours (name, date, mode) VALUES (%s, %s, %s)', (name, '2025-03-15', mode))
    db.commit()
    tour_id = cursor.lastrowid
    cursor.close()
    return jsonify({'status': 'success', 'tour_id': tour_id})

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    data = request.json
    user_id = data.get('user_id')
    tour_id = data.get('tour_id')
    points = data.get('points', 0)
    answer = data.get('answer')
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
        return jsonify({'id': tour[0], 'name': tour[1], 'mode': tour[2]})
    return jsonify({'id': None})

@app.route('/api/tour_answers', methods=['GET'])
def tour_answers():
    tour_id = request.args.get('tour_id')
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT p.name, r.answer FROM results r JOIN players p ON r.player_id = p.id WHERE r.tour_id = %s', (tour_id,))
    answers = [{'name': row[0], 'answer': row[1]} for row in cursor.fetchall()]
    cursor.close()
    return jsonify({'answers': answers})

@app.route('/api/tour_results', methods=['GET'])
def tour_results():
    tour_id = request.args.get('tour_id')
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