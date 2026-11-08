import sqlite3
import json

db_path = "C:/Users/shann/.gemini/antigravity/conversations/c9bb3cc4-b7dd-4014-a450-8bf8bd193edf.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT idx, step_type, status, error_details, substr(step_payload, 1, 200) FROM steps ORDER BY idx ASC LIMIT 3")
for row in cur.fetchall():
    print(row)

print("--- LAST 3 STEPS ---")
cur.execute("SELECT idx, step_type, status, error_details, substr(step_payload, 1, 500) FROM steps ORDER BY idx DESC LIMIT 3")
for row in cur.fetchall():
    print(row)

conn.close()
