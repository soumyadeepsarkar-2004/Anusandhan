import sqlite3
import re
import json

agents = [
    ("c9bb3cc4-b7dd-4014-a450-8bf8bd193edf", "DeepCoder 1"),
    ("b8e2968c-bbca-437a-bb7b-3aabe74816d0", "DeepCoder 2"),
    ("39c3ea69-16cc-4991-b2d8-aedb12279e95", "DeepCoder 3"),
    ("54ba4999-05e1-4ae2-98ab-69f2664a9442", "Teamwork Sentinel 1"),
    ("75068b95-c0af-48ea-9f7c-ddf93c35b35b", "Teamwork Sentinel 2")
]

out = []

for agent_id, name in agents:
    out.append("="*70)
    out.append(f"AGENT: {name} ({agent_id})")
    out.append("="*70)
    db_path = f"C:/Users/shann/.gemini/antigravity/conversations/{agent_id}.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT idx, step_type, status, error_details, step_payload FROM steps ORDER BY idx ASC")
    rows = cur.fetchall()
    out.append(f"Total steps: {len(rows)}")
    
    send_messages = []
    task_prompts = []
    errors = []
    
    for idx, st_type, status, err, payload in rows:
        if err:
            errors.append((idx, str(err)))
        if not payload:
            continue
        try:
            text = payload.decode('utf-8', errors='ignore')
            
            # Look for subagent prompt or user instructions
            if idx == 0 or idx == 1:
                # search for main task instructions
                match = re.search(r'content=([^\n]+(?:\n[^\n]+){1,30})', text)
                if match:
                    task_prompts.append((idx, match.group(1)[:2000]))
                else:
                    # Look for [Message] or task description
                    m2 = re.search(r'(?:Task:|Instructions:|Mission:)(.*?)(?:\n\n|\Z)', text, re.DOTALL)
                    if m2:
                        task_prompts.append((idx, m2.group(0)[:1500]))
            
            # Look for send_message calls
            sm_matches = re.findall(r'send_message.*?"Message":"(.*?)(?:","Recipient|"}$)', text, re.DOTALL)
            for sm in sm_matches:
                clean_sm = sm.encode().decode('unicode_escape', errors='ignore')
                send_messages.append((idx, clean_sm))
        except Exception as e:
            pass
            
    out.append(f"Errors recorded in steps: {len(errors)}")
    for e_idx, e_val in errors:
        out.append(f"  Step {e_idx} Error: {e_val[:200]}")
        
    out.append(f"Total send_message calls: {len(send_messages)}")
    if task_prompts:
        out.append("\n--- TASK / PROMPT RECEIVED ---")
        for p_idx, p_text in task_prompts:
            out.append(f"[Step {p_idx}]:\n{p_text}\n")
            
    if send_messages:
        out.append("\n--- LAST SEND_MESSAGE (Final Report to Parent) ---")
        last_idx, last_msg = send_messages[-1]
        out.append(f"[Step {last_idx}]:\n{last_msg}\n")

    conn.close()

with open("c:/PROJECTS/ResearchIntern_Pro/.agents/teamwork/explorer_audit_1/agent_audit_raw.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))

print("Wrote audit to agent_audit_raw.txt successfully.")
