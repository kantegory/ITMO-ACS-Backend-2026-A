#!/usr/bin/env python3
"""Проверка работающего мониторинга на сервере. Не читает секреты."""
import json
from urllib.parse import urlencode
from urllib.request import urlopen

def get(url):
    with urlopen(url, timeout=15) as response:
        return response.read().decode()

def query(expression):
    result=json.loads(get('http://127.0.0.1:9090/api/v1/query?'+urlencode({'query':expression})))
    if result['status'] != 'success':
        raise RuntimeError('Prometheus query failed')
    return result['data']['result']

grafana=json.loads(get('http://127.0.0.1:3000/api/health'))
assert grafana.get('database')=='ok', 'Grafana database is not ready'
print('Grafana: OK; версия '+grafana['version'])
assert get('http://127.0.0.1:9090/-/ready').strip()
assert get('http://127.0.0.1:3100/ready').strip()=='ready'
print('Prometheus и Loki: готовы')

node=query('up{job="vm"}')
assert len(node)==1 and float(node[0]['value'][1])==1, 'Метрики ВМ недоступны'
for name,expression in [
    ('CPU, ядер','count(node_cpu_seconds_total{job="vm",mode="idle"})'),
    ('RAM, байт','node_memory_MemTotal_bytes{job="vm"}'),
    ('Корневой диск, байт','node_filesystem_size_bytes{job="vm",mountpoint="/",fstype!~"tmpfs|overlay"}'),
    ('Сеть, принятые байты','sum(node_network_receive_bytes_total{job="vm",device!~"lo|veth.*|docker.*|br-.*"})'),
]:
    values=query(expression)
    assert values, name+' — нет данных'
    print(name+': '+', '.join(v['value'][1] for v in values))

health=query('probe_success{job="microservices_health"}')
assert len(health)==6, 'Ожидалось шесть микросервисов'
for item in sorted(health,key=lambda row:row['metric']['service']):
    print(item['metric']['service']+': '+('ДОСТУПЕН' if item['value'][1]=='1' else 'НЕДОСТУПЕН'))
assert all(item['value'][1]=='1' for item in health), 'Есть недоступные микросервисы'
public=query('probe_success{job="public_gateway"}')
assert len(public)==1 and public[0]['value'][1]=='1', 'Проверка Nginx/Gateway по IP не прошла'
print('Nginx → Gateway по публичному IP (запрос с ВМ): OK')

labels=json.loads(get('http://127.0.0.1:3100/loki/api/v1/label/container/values'))
assert labels.get('status')=='success' and labels.get('data'), 'Логи ещё не поступили'
print('Логи в Loki: '+', '.join(labels['data']))
print('Основные проверки мониторинга пройдены.')
