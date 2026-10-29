#!/usr/bin/env python3
"""检查多页面入口、相对链接及静态资产；同时适用于根目录和仓库子路径。"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent / 'dist'

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('href', 'src'):
            if attrs.get(key):
                self.paths.append(attrs[key])

assert (ROOT / 'index.html').is_file(), '缺少功能首页'
assert (ROOT / 'apps/portrait/index.html').is_file(), '缺少人物画像页面'
count = 0
for html in ROOT.rglob('*.html'):
    parser = Links()
    parser.feed(html.read_text(encoding='utf-8'))
    for url in parser.paths:
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        assert not parsed.path.startswith('/'), f'{html}: 使用相对路径以支持 /my-web/：{url}'
        target = (html.parent / unquote(parsed.path)).resolve()
        assert target.is_relative_to(ROOT.resolve()), f'链接超出站点目录：{url}'
        assert target.exists(), f'缺少链接文件：{html} → {url}'
        count += 1
print(f'通过：{count} 个本地链接与资源，支持站点根目录和仓库子路径。')
