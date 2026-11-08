import sqlite3

db_path = "C:/Users/shann/.gemini/antigravity/conversations/54ba4999-05e1-4ae2-98ab-69f2664a9442.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT idx, step_type, status, error_details, substr(step_payload, 1, 400) FROM steps ORDER BY idx DESC LIMIT 15")
rows = cur.fetchall()
for r in reversed(rows):
    print(f"Step {r[0]} | type: {r[1]} | status: {r[2]} | err: {r[3]}")
    payload_str = r[4].decode('utf-8', errors='ignore') if r[4] else ""
    # print snippet
    clean = ' '.join(payload_str.split())
    print(f"   Payload: {clean[:200].encode('ascii', errors='backslashreplace').decode('ascii')}")

conn.close()
