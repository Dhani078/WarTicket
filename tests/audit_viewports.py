import asyncio
import json
import os
import subprocess
import time
import urllib.request
import websockets

VIEWPORTS = [
    {"name": "Mobile Small (iPhone SE)", "width": 375, "height": 667},
    {"name": "Mobile Standard (iPhone 14 / Android)", "width": 390, "height": 844},
    {"name": "Tablet (iPad Mini)", "width": 768, "height": 1024},
    {"name": "Desktop High-DPI", "width": 1440, "height": 900},
    {"name": "Desktop 1080p", "width": 1920, "height": 1080},
]

def ensure_services():
    # 1. Ensure frontend dev server
    try:
        urllib.request.urlopen("http://127.0.0.1:5173/", timeout=1)
    except Exception:
        subprocess.Popen(["npm.cmd", "run", "dev"], cwd=r"C:\xampp\htdocs\WarTicket\frontend", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(3)

    # 2. Ensure Chrome/Edge CDP
    try:
        urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=1)
        return None
    except Exception:
        edge_paths = [
            r"C:\Program Files (x86)\Microsoft\EdgeCore\154.0.4258.53\msedge.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        ]
        exe = next((p for p in edge_paths if os.path.exists(p)), None)
        if exe:
            proc = subprocess.Popen([
                exe, "--headless", "--remote-debugging-port=9222",
                r"--user-data-dir=C:\Users\Anomali\AppData\Local\Temp\cdp_audit",
                "--disable-gpu", "http://127.0.0.1:5173/"
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(2)
            return proc
    return None

async def audit():
    cdp_proc = ensure_services()
    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        tabs = json.loads(req.read().decode("utf-8"))
        page_tab = next(t for t in tabs if t.get("type") == "page" and "5173" in t.get("url", ""))
        ws_url = page_tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 1

            async def send_cmd(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp = await ws.recv()
                    data = json.loads(resp)
                    if data.get("id") == msg_id:
                        return data.get("result")

            await send_cmd("Network.setCacheDisabled", {"cacheDisabled": True})
            await send_cmd("Page.navigate", {"url": "http://127.0.0.1:5173/"})
            await asyncio.sleep(2)

            print("==================================================================")
            print("          WAR TIKET - RESPONSIVE VIEWPORT AUDIT REPORT            ")
            print("==================================================================")

            all_clean = True
            for vp in VIEWPORTS:
                await send_cmd("Emulation.setDeviceMetricsOverride", {
                    "width": vp["width"],
                    "height": vp["height"],
                    "deviceScaleFactor": 2,
                    "mobile": vp["width"] < 768
                })
                await asyncio.sleep(0.5)

                eval_res = await send_cmd("Runtime.evaluate", {
                    "expression": """
                    (() => {
                        const docW = document.documentElement.scrollWidth;
                        const winW = window.innerWidth;
                        const bodyW = document.body.scrollWidth;
                        const hasOverflow = docW > winW || bodyW > winW;
                        return { docW, winW, bodyW, hasOverflow, overflowPx: Math.max(0, docW - winW) };
                    })()
                    """,
                    "returnByValue": True
                })

                data = eval_res["result"]["value"]
                status = "✓ ZERO OVERFLOW (PERFECT)" if not data["hasOverflow"] else f"✗ OVERFLOW DETECTED: +{data['overflowPx']}px"
                print(f"[{vp['name']}] {vp['width']}x{vp['height']} -> {status} (doc: {data['docW']}px, win: {data['winW']}px)")
                if data["hasOverflow"]:
                    all_clean = False

            print("==================================================================")
            if all_clean:
                print("AUDIT VERDICT: 100% CLEAN - ZERO HORIZONTAL OVERFLOW ACROSS ALL DEVICES!")
            else:
                print("AUDIT VERDICT: OVERFLOW DETECTED ON ONE OR MORE VIEWPORTS.")
            print("==================================================================")
    finally:
        if cdp_proc:
            cdp_proc.terminate()

if __name__ == "__main__":
    asyncio.run(audit())
