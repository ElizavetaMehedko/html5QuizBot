from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

def get_db():
    conn = sqlite3.connect('quiz.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                total_points REAL DEFAULT 0
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tours (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                mode TEXT NOT NULL,
                correct_answer TEXT,
                status TEXT DEFAULT 'active'
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id INTEGER NOT NULL,
                tour_id INTEGER NOT NULL,
                points REAL NOT NULL,
                answer TEXT,
                FOREIGN KEY (player_id) REFERENCES players (id),
                FOREIGN KEY (tour_id) REFERENCES tours (id)
            )''')
        conn.commit()

init_db()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    user_id = data['user_id']
    name = data['name']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT OR IGNORE INTO players (id, name) VALUES (?, ?)', (user_id, name))
        conn.commit()
    return jsonify({'status': 'success'})

@app.route('/api/current_tour', methods=['GET'])
def get_current_tour():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tours WHERE status = "active" ORDER BY id DESC LIMIT 1')
        tour = cursor.fetchone()
        if tour:
            return jsonify({
                'id': tour['id'],
                'mode': tour['mode'],
                'correct_answer': tour['correct_answer']
            })
        return jsonify({'status': 'no_active_tour'})

@app.route('/api/submit_answer', methods=['POST'])
def submit_answer():
    data = request.json
    user_id = data['user_id']
    tour_id = data['tour_id']
    points = data['points']
    answer = data['answer']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE players SET total_points = total_points + ? WHERE id = ?', (points, user_id))
        cursor.execute('INSERT INTO results (player_id, tour_id, points, answer) VALUES (?, ?, ?, ?)', 
                       (user_id, tour_id, points, answer))
        conn.commit()
    return jsonify({'status': 'success'})

@app.route('/api/end_tour', methods=['POST'])
def end_tour():
    data = request.json
    tour_id = data['tour_id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE tours SET status = "finished" WHERE id = ?', (tour_id,))
        cursor.execute('SELECT player_id, points, answer FROM results WHERE tour_id = ?', (tour_id,))
        results = cursor.fetchall()
        conn.commit()
    return jsonify({'results': [dict(row) for row in results]})

@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT name, total_points FROM players ORDER BY total_points DESC')
        players = cursor.fetchall()
    return jsonify({'leaderboard': [dict(row) for row in players]})

@app.route('/api/start_tour', methods=['POST'])
def start_tour():
    data = request.json
    mode = data['mode']
    name = data['name']
    date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO tours (name, date, mode, status) VALUES (?, ?, ?, ?)', 
                       (name, date, mode, 'active'))
        conn.commit()
        cursor.execute('SELECT last_insert_rowid()')
        tour_id = cursor.fetchone()[0]
    return jsonify({'tour_id': tour_id})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)