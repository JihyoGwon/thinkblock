"""
백엔드와 프론트엔드를 동시에 실행하는 스크립트
"""
import subprocess
import sys
import os
import time
import threading
import signal

processes = []

def signal_handler(sig, frame):
    """Ctrl+C로 종료 시 모든 프로세스 종료"""
    print("\n\n서버를 종료합니다...")
    for p in processes:
        if p:
            try:
                p.terminate()
            except:
                pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def start_backend():
    """백엔드 서버 시작"""
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
    
    if not os.path.exists(venv_python):
        print("❌ 백엔드 가상환경을 찾을 수 없습니다.")
        print("   먼저 다음 명령어를 실행하세요:")
        print("   cd backend")
        print("   python -m venv venv")
        print("   .\\venv\\Scripts\\Activate.ps1")
        print("   pip install -r requirements.txt")
        return None
    
    print("🚀 백엔드 서버 시작 중...")
    process = subprocess.Popen(
        [venv_python, 'run_local.py'],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(process)
    return process

def start_frontend():
    """프론트엔드 서버 시작"""
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    
    # PATH에서 npm 찾기
    import shutil
    npm_cmd = shutil.which('npm')
    
    if not npm_cmd:
        # Windows에서 직접 경로 확인
        node_paths = [
            r'C:\Program Files\nodejs\npm.cmd',
            r'C:\Program Files (x86)\nodejs\npm.cmd',
        ]
        for path in node_paths:
            if os.path.exists(path):
                npm_cmd = path
                break
    
    if not npm_cmd:
        print("❌ npm을 찾을 수 없습니다.")
        print("   Node.js가 설치되어 있는지 확인하세요.")
        print("   https://nodejs.org/ 에서 설치할 수 있습니다.")
        return None
    
    print("🚀 프론트엔드 서버 시작 중...")
    process = subprocess.Popen(
        [npm_cmd, 'run', 'dev'],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(process)
    return process

def print_output(process, name):
    """프로세스 출력을 실시간으로 출력"""
    if process:
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[{name}] {line.rstrip()}")
        except:
            pass

def main():
    print("=" * 60)
    print("ThinkBlock 서버 시작")
    print("=" * 60)
    print()
    
    backend_process = start_backend()
    if backend_process:
        backend_thread = threading.Thread(
            target=print_output,
            args=(backend_process, '백엔드'),
            daemon=True
        )
        backend_thread.start()
    
    time.sleep(2)  # 백엔드가 시작될 시간
    
    frontend_process = start_frontend()
    if frontend_process:
        frontend_thread = threading.Thread(
            target=print_output,
            args=(frontend_process, '프론트엔드'),
            daemon=True
        )
        frontend_thread.start()
    
    time.sleep(3)  # 서버들이 시작될 시간
    
    if backend_process and frontend_process:
        print()
        print("=" * 60)
        print("✅ 서버가 실행 중입니다!")
        print("=" * 60)
        print("📦 백엔드: http://localhost:8002")
        print("🌐 프론트엔드: http://localhost:3000 또는 http://localhost:5173")
        print()
        print("종료하려면 Ctrl+C를 누르세요.")
        print("=" * 60)
        print()
    
    try:
        # 프로세스들이 실행 중인지 확인
        while True:
            if backend_process and backend_process.poll() is not None:
                print("\n⚠️ 백엔드 서버가 종료되었습니다.")
                break
            if frontend_process and frontend_process.poll() is not None:
                print("\n⚠️ 프론트엔드 서버가 종료되었습니다.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n서버를 종료합니다...")
    finally:
        for p in processes:
            if p:
                try:
                    p.terminate()
                    p.wait(timeout=5)
                except:
                    try:
                        p.kill()
                    except:
                        pass
        print("✅ 모든 서버가 종료되었습니다.")

if __name__ == '__main__':
    main()

