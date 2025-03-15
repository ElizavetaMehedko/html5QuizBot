CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    total_points REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tours (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    mode TEXT NOT NULL,
    correct_answer INTEGER,
    status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS results (
    id SERIAL PRIMARY KEY,
    player_id INTEGER,
    tour_id INTEGER,
    points REAL DEFAULT 0,
    answer INTEGER,
    FOREIGN KEY (player_id) REFERENCES players (id),
    FOREIGN KEY (tour_id) REFERENCES tours (id)
);