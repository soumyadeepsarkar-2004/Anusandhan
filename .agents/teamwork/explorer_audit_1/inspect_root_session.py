import sqlite3
import re

db_path = "C:/Users/shann/.gemini/antigravity/conversations/760a5e42-6895-4c9b-8e19-4019afc3d683.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT idx, step_type, status, error_details, step_payload FROM steps WHERE idx >= 4945 AND idx <= 5461 ORDER BY idx ASC")
rows = cur.fetchall()

lines = []
lines.append(f"# Root Session Steps Analysis ({len(rows)} steps)\n")

for r in rows:
    payload = r[4].decode('utf-8', errors='ignore') if r[4] else ""
    # Filter printable
    printable = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', payload)
    if any(k in printable.lower() for k in ["invoke_subagent", "teamwork", "credit", "54ba4999", "75068b95", "walkthrough", "error_details"]):
        clean = ' '.join(printable.split())
        lines.append(f"- **Step {r[0]}** (type {r[1]}, status {r[2]}): {clean[:300]}")

conn.close()

with open("c:/PROJECTS/ResearchIntern_Pro/.agents/teamwork/explorer_audit_1/root_session_audit.md", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Wrote root session audit markdown successfully.")
