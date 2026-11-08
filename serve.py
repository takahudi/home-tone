"""シミュレーターをローカルで開くための簡易 Web サーバー。

使い方（プロジェクト直下で）:
    uv run serve.py            # http://localhost:8000/ をブラウザで開く
    uv run serve.py --port 9000 --no-browser
"""
import argparse
import functools
import http.server
import socketserver
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "facade-simulator"


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows ではレジストリ次第で .js が text/plain になり ES モジュールが読めないため明示する
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".jpg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")  # 更新したファイルがすぐ反映されるように
        super().end_headers()


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = False  # 使用中のポートは避けて次を探す


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-browser", action="store_true", help="ブラウザを自動で開かない")
    args = ap.parse_args()

    handler = functools.partial(Handler, directory=str(ROOT))
    for port in range(args.port, args.port + 20):
        try:
            httpd = Server(("localhost", port), handler)
            break
        except OSError:
            continue
    else:
        print(f"ポート {args.port} 付近が使えませんでした。", file=sys.stderr)
        return 1

    url = f"http://localhost:{port}/"
    print(f"シミュレーターを配信中: {url}")
    print("止めるときは Ctrl+C（start.cmd から開いた場合はウィンドウを閉じる）")
    if not args.no_browser:
        webbrowser.open(url)
    with httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
