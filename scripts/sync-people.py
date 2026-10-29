#!/usr/bin/env python3
"""由唯一维护源 data/people.json 生成支持 file:// 的浏览器数据脚本。"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent

def load_people():
    people = json.loads((ROOT / 'data/people.json').read_text(encoding='utf-8'))
    if len(people) != 500:
        raise ValueError('人物库须保持 500 条')
    for field in ('id', 'name', 'tags', 'v', 'desc', 'advice'):
        values = [json.dumps(p[field], ensure_ascii=False, sort_keys=True) for p in people]
        if len(values) != len(set(values)):
            raise ValueError(f'{field} 有重复配置，请逐人检查')
    for p in people:
        if len(p['v']) != 8 or any(type(v) not in (int, float) or not 0 <= v <= 100 for v in p['v']) or not sum(p['v']):
            raise ValueError(f"{p['name']} 八维参数应为 8 个 0—100 数值且不全为 0")
        if len(p['tags']) != 3 or any(not isinstance(t, str) or not t.strip() for t in p['tags']):
            raise ValueError(f"{p['name']} 须配置 3 个标签")
        if any(not isinstance(p.get(field), str) or not p[field].strip() for field in ('name', 'desc', 'advice', 'line', 'role', 'type')):
            raise ValueError(f"{p['name']} 缺少专属内容")
    return people

if __name__ == '__main__':
    people = load_people()
    target = ROOT / 'dist/apps/portrait/people-data.js'
    target.write_text('// 自动生成，请维护 data/people.json 后运行 scripts/sync-people.py。\nwindow.PORTRAIT_PEOPLE = ' + json.dumps(people, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(f'已校验并同步 {len(people)} 位人物：{target}')
