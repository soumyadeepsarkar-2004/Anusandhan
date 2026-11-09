import os
import sys
import json
import tarfile
import tempfile
import time
import urllib.request
import urllib.error

def deploy():
    # 1. Load Token
    cfg_path = os.path.expanduser('~/.antideploy/config.json')
    if not os.path.exists(cfg_path):
        print("ERROR: ~/.antideploy/config.json does not exist.")
        sys.exit(1)
        
    with open(cfg_path, 'rb') as f:
        raw = f.read()
    for enc in ['utf-8-sig', 'utf-16', 'utf-8']:
        try:
            cfg = json.loads(raw.decode(enc))
            token = cfg.get('token')
            if token:
                break
        except Exception:
            pass

    if not token:
        print("ERROR: No token found in ~/.antideploy/config.json")
        sys.exit(1)

    # 2. Load Application ID
    app_json_path = '.antideploy.json'
    if not os.path.exists(app_json_path):
        print("ERROR: .antideploy.json not found")
        sys.exit(1)
        
    with open(app_json_path, 'r', encoding='utf-8') as f:
        app_data = json.load(f)
    app_id = app_data.get('applicationId')
    print(f"Deploying application '{app_data.get('name')}' ({app_id})...")

    # 3. Create tar.gz archive
    excludes = {
        '.git', 'node_modules', '.venv', 'android', 'ios',
        'cloudflared.exe', 'server_run.log', '.antideploy'
    }
    
    def filter_tar(tarinfo):
        parts = tarinfo.name.replace('\\', '/').split('/')
        for p in parts:
            if p in excludes or p.endswith('.log') or p.endswith('.pyc') or p == '__pycache__':
                return None
        return tarinfo

    with tempfile.NamedTemporaryFile(suffix='.tar.gz', delete=False) as tmp_tar:
        tmp_tar_path = tmp_tar.name

    try:
        print("Packaging project into compressed tar archive...")
        with tarfile.open(tmp_tar_path, "w:gz") as tar:
            tar.add(".", arcname="", filter=filter_tar)
            
        tar_size = os.path.getsize(tmp_tar_path)
        print(f"Archive created: {tar_size / (1024 * 1024):.2f} MB")

        # 4. Upload to Antideploy
        url = f"https://antideploy.com/api/v1/deploy?applicationId={app_id}"
        boundary = "----AntideployBoundary" + str(int(time.time()))
        
        with open(tmp_tar_path, 'rb') as f:
            tar_bytes = f.read()

        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="archive"; filename="project.tar.gz"\r\n'
            f"Content-Type: application/gzip\r\n\r\n"
        ).encode('utf-8') + tar_bytes + f"\r\n--{boundary}--\r\n".encode('utf-8')

        req = urllib.request.Request(
            url,
            data=body,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': f'multipart/form-data; boundary={boundary}',
                'User-Agent': 'Antigravity/1.0'
            },
            method='POST'
        )

        print("Uploading archive to Antideploy...")
        try:
            with urllib.request.urlopen(req) as resp:
                status_code = resp.status
                resp_data = json.loads(resp.read().decode('utf-8'))
                print("Deploy Response Status:", status_code)
                print("Response:", json.dumps(resp_data, indent=2))
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode('utf-8', errors='ignore')
            print(f"HTTPError {e.code}: {err_msg}")
            sys.exit(1)

        task_id = resp_data.get('taskId')
        watch_url = resp_data.get('watch') or f"https://antideploy.com/api/v1/deployments/{task_id}"

        # 5. Poll Deployment Task
        print(f"Watching deployment {task_id}...")
        for _ in range(60):
            time.sleep(3)
            poll_req = urllib.request.Request(
                watch_url,
                headers={'Authorization': f'Bearer {token}'}
            )
            try:
                with urllib.request.urlopen(poll_req) as poll_resp:
                    poll_data = json.loads(poll_resp.read().decode('utf-8'))
                    current_status = poll_data.get('status')
                    print(f"Status: {current_status} | Step: {poll_data.get('currentStep') or poll_data.get('failedStep')}")
                    
                    if current_status == 'succeeded':
                        print("\n=== DEPLOYMENT SUCCEEDED! ===")
                        print("Summary:", poll_data.get('summary'))
                        print("Live URL:", poll_data.get('url'))
                        print("Details:", json.dumps(poll_data, indent=2))
                        return poll_data
                    elif current_status == 'failed':
                        print("\n=== DEPLOYMENT FAILED ===")
                        print("Error:", poll_data.get('error'))
                        print("Failed Step:", poll_data.get('failedStep'))
                        print("Build Log:", poll_data.get('buildLog') or poll_data.get('deployment', {}).get('buildLog'))
                        print("Runtime Log:", poll_data.get('runtimeLog') or poll_data.get('deployment', {}).get('runtimeLog'))
                        sys.exit(1)
            except urllib.error.HTTPError as e:
                print(f"Polling HTTPError {e.code}: {e.read().decode('utf-8', errors='ignore')}")

    finally:
        if os.path.exists(tmp_tar_path):
            os.remove(tmp_tar_path)

if __name__ == '__main__':
    deploy()
