"""Render immutable image tags without modifying configuration values."""
import copy
import json
from pathlib import Path
import re
import sys


def render(document, sha):
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise ValueError('IMAGE_TAG must be a full lower-case Git SHA')
    result = copy.deepcopy(document)

    def visit(value):
        if isinstance(value, dict):
            for key, item in value.items():
                if key == 'image' and isinstance(item, str):
                    value[key] = item.replace(':IMAGE_TAG', ':' + sha)
                else:
                    visit(item)
        elif isinstance(value, list):
            for item in value:
                visit(item)

    visit(result)
    return result


if __name__ == '__main__':
    document = json.load(sys.stdin)
    result = render(document, sys.argv[1])
    if len(sys.argv) == 3:
        directory = Path(sys.argv[2])
        directory.mkdir(parents=True, exist_ok=True)
        for item in result['items']:
            path = directory / (item['metadata']['name'] + '-' + item['kind'] + '.json')
            path.write_text(json.dumps(item), encoding='utf-8')
    else:
        json.dump(result, sys.stdout)
