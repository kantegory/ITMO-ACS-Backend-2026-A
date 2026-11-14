#!/usr/bin/env python3
"""Создаёт JSON дашборда и правило Grafana из описания ниже."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
prom = {"type": "prometheus", "uid": "lab6-prometheus"}
loki = {"type": "loki", "uid": "lab6-loki"}
panels = []

def panel(title, kind, x, y, w, h, expressions, unit="none", description=""):
    item = {
        "id": len(panels) + 1, "title": title, "type": kind,
        "description": description, "datasource": prom,
        "gridPos": {"x": x, "y": y, "w": w, "h": h},
        "fieldConfig": {"defaults": {"unit": unit, "color": {"mode": "palette-classic"}}, "overrides": []},
        "targets": [
            {"refId": chr(65+i), "expr": expr, "legendFormat": legend,
             "instant": kind == "stat", "range": kind != "stat", "datasource": prom,
             "editorMode": "code"}
            for i, (expr, legend) in enumerate(expressions)
        ],
        "options": {},
    }
    if kind == "stat":
        item["options"] = {
            "reduceOptions": {"calcs": ["lastNotNull"], "fields": "", "values": False},
            "orientation": "auto", "textMode": "value", "colorMode": "value",
            "graphMode": "area", "justifyMode": "auto",
        }
    elif kind == "timeseries":
        item["options"] = {"legend": {"displayMode": "list", "placement": "bottom"}, "tooltip": {"mode": "multi"}}
        item["fieldConfig"]["defaults"]["custom"] = {
            "drawStyle": "line", "lineInterpolation": "smooth", "lineWidth": 2,
            "fillOpacity": 12, "showPoints": "never", "spanNulls": False,
        }
    panels.append(item)
    return item

cpu = '100 * (1 - avg(rate(node_cpu_seconds_total{job="vm",mode="idle"}[$__rate_interval])))'
ram = '100 * (1 - node_memory_MemAvailable_bytes{job="vm"} / node_memory_MemTotal_bytes{job="vm"})'
disk = '100 * (1 - node_filesystem_avail_bytes{job="vm",mountpoint="/",fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{job="vm",mountpoint="/",fstype!~"tmpfs|overlay"})'

for title, x, expr in [("CPU ВМ",0,cpu), ("RAM ВМ",4,ram), ("Диск, занято",8,disk)]:
    item=panel(title,"stat",x,0,4,4,[(expr,"")],"percent")
    item["fieldConfig"]["defaults"].update({"min":0,"max":100,"decimals":1,
        "color":{"mode":"thresholds"},"thresholds":{"mode":"absolute","steps":[
            {"color":"green","value":None},{"color":"orange","value":75},{"color":"red","value":90}]}})

count=panel("Сервисов доступно из 6","stat",12,0,6,4,
    [('sum(probe_success{job="microservices_health"})',"")])
count["fieldConfig"]["defaults"].update({"decimals":0,"min":0,"max":6,
    "color":{"mode":"thresholds"},"thresholds":{"mode":"absolute","steps":[
        {"color":"red","value":None},{"color":"green","value":6}]}})

def health_style(item):
    item["fieldConfig"]["defaults"].update({
        "min":0,"max":1,"decimals":0,"color":{"mode":"thresholds"},
        "thresholds":{"mode":"absolute","steps":[{"color":"red","value":None},{"color":"green","value":1}]},
        "mappings":[{"type":"value","options":{
            "0":{"text":"Недоступен","color":"red","index":0},
            "1":{"text":"Доступен","color":"green","index":1}}}],
    })
    if item["type"] == "stat":
        item["options"].update({"colorMode":"background","graphMode":"none"})

public=panel("Nginx → Gateway по IP","stat",18,0,6,4,
    [('probe_success{job="public_gateway"}',"")],
    description="Запрос к публичному адресу выполняется с этой же ВМ. Полное выключение ВМ требует внешнего мониторинга.")
health_style(public)

services=["api-gateway","identity-service","catalog-service","menu-service","reservation-service","review-service"]
for i,service in enumerate(services):
    item=panel(service,"stat",(i % 3)*8,4+(i // 3)*3,8,3,
        [(f'probe_success{{job="microservices_health",service="{service}"}}',"")],
        description="Доступен: /health отвечает HTTP 200 и содержит status: ok. Это проверка доступности HTTP-процесса.")
    health_style(item)

panel("Использование CPU","timeseries",0,10,12,7,[(cpu,"CPU")],"percent")
panel("Оперативная память","timeseries",12,10,12,7,[
    ('node_memory_MemTotal_bytes{job="vm"} - node_memory_MemAvailable_bytes{job="vm"}',"Используется"),
    ('node_memory_MemAvailable_bytes{job="vm"}',"Доступно")],"bytes")
panel("Занятое и свободное место на диске","timeseries",0,17,12,7,[
    ('node_filesystem_size_bytes{job="vm",mountpoint="/",fstype!~"tmpfs|overlay"} - node_filesystem_avail_bytes{job="vm",mountpoint="/",fstype!~"tmpfs|overlay"}',"Занято / недоступно пользователю"),
    ('node_filesystem_avail_bytes{job="vm",mountpoint="/",fstype!~"tmpfs|overlay"}',"Доступно")],"bytes")
panel("Дисковые операции","timeseries",12,17,12,7,[
    ('sum(rate(node_disk_read_bytes_total{job="vm",device=~"vd[a-z]+|sd[a-z]+|nvme[0-9]+n[0-9]+"}[$__rate_interval]))',"Чтение"),
    ('sum(rate(node_disk_written_bytes_total{job="vm",device=~"vd[a-z]+|sd[a-z]+|nvme[0-9]+n[0-9]+"}[$__rate_interval]))',"Запись")],"Bps")
panel("Сетевой трафик ВМ","timeseries",0,24,12,7,[
    ('sum(rate(node_network_receive_bytes_total{job="vm",device!~"lo|veth.*|docker.*|br-.*"}[$__rate_interval]))',"Входящий"),
    ('sum(rate(node_network_transmit_bytes_total{job="vm",device!~"lo|veth.*|docker.*|br-.*"}[$__rate_interval]))',"Исходящий")],"Bps")
history=panel("История доступности микросервисов","state-timeline",12,24,12,7,
    [('probe_success{job="microservices_health"}',"{{service}}")])
health_style(history)
history["options"]={"mergeValues":True,"showValue":"never","rowHeight":0.8,
    "legend":{"displayMode":"hidden"},"tooltip":{"mode":"single"},"alignValue":"center"}

logs=panel("Логи контейнеров","logs",0,31,24,12,[])
logs["datasource"]=loki
logs["description"]="Настоящие stdout/stderr контейнеров. Выберите контейнер и период. Остановленный тихий сервис может не создавать новых строк; остановка сама по себе не обязана печатать ошибку."
logs["targets"]=[{"refId":"A","datasource":loki,"expr":'{job="docker",container=~"${container:regex}"} |= ${search:doublequote}',"queryType":"range","editorMode":"code"}]
logs["options"]={"showTime":True,"showLabels":True,"showCommonLabels":False,"wrapLogMessage":True,
    "sortOrder":"Descending","dedupStrategy":"none","enableLogDetails":True,"prettifyLogMessage":False}

dashboard={
    "id":None,"uid":"lab6-it-garage","title":"it-garage — мониторинг микросервисов",
    "description":"ЛР6: ресурсы Ubuntu ВМ, HTTP healthcheck каждого микросервиса и логи всех Docker-контейнеров.",
    "tags":["ЛР6","it-garage"],"timezone":"browser","schemaVersion":40,"version":1,
    "editable":True,"refresh":"10s","time":{"from":"now-30m","to":"now"},
    "graphTooltip":1,"panels":panels,
    "annotations":{"list":[{"builtIn":1,"datasource":{"type":"grafana","uid":"-- Grafana --"},
        "enable":True,"hide":True,"iconColor":"rgba(0,211,255,1)","name":"Annotations & Alerts","type":"dashboard"}]},
    "templating":{"list":[
        {"name":"container","label":"Контейнер","type":"query","datasource":loki,
         "query":{"label":"container","refId":"LokiVariableQueryEditor-VariableQuery","stream":"{job=\"docker\"}","type":1},
         "definition":"label_values({job=\"docker\"}, container)","refresh":2,"sort":1,
         "includeAll":True,"allValue":".*","multi":True,"options":[],
         "current":{"selected":True,"text":["All"],"value":["$__all"]}},
        {"name":"search","label":"Поиск в логах","type":"textbox","query":"",
         "current":{"selected":True,"text":"","value":""},"options":[{"selected":True,"text":"","value":""}]},
    ]},
}
out=root/'grafana/dashboards/it-garage.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dashboard,ensure_ascii=False,indent=2)+'\n')

rule={
    "uid":"lab6-service-unavailable","title":"Микросервис недоступен","condition":"C",
    "for":"60s","noDataState":"Alerting","execErrState":"Alerting","isPaused":False,
    "annotations":{
        "summary":"Сервис {{ $labels.service }} недоступен на it-garage",
        "description":"HTTP /health не проходит проверку более минуты. После восстановления отправляется уведомление о восстановлении.",
        "__dashboardUid__":"lab6-it-garage","__panelId__":str(history['id']),
    },
    "labels":{"severity":"critical","server":"it-garage","lab":"lab6"},
    "data":[
        {"refId":"A","relativeTimeRange":{"from":60,"to":0},"datasourceUid":"lab6-prometheus",
         "model":{"refId":"A","datasource":prom,"expr":'probe_success{job="microservices_health"}',
                  "instant":True,"range":False,"intervalMs":1000,"maxDataPoints":43200}},
        {"refId":"B","relativeTimeRange":{"from":0,"to":0},"datasourceUid":"__expr__",
         "model":{"refId":"B","datasource":{"type":"__expr__","uid":"__expr__"},
                  "type":"reduce","expression":"A","reducer":"last","settings":{"mode":"dropNN"},
                  "intervalMs":1000,"maxDataPoints":43200}},
        {"refId":"C","relativeTimeRange":{"from":0,"to":0},"datasourceUid":"__expr__",
         "model":{"refId":"C","datasource":{"type":"__expr__","uid":"__expr__"},
                  "type":"threshold","expression":"B","intervalMs":1000,"maxDataPoints":43200,
                  "conditions":[{"evaluator":{"params":[1],"type":"lt"},"operator":{"type":"and"},
                                 "query":{"params":["C"]},"reducer":{"params":[],"type":"last"},"type":"query"}]}},
    ],
}
alerts={"apiVersion":1,"groups":[{"orgId":1,"name":"Проверка микросервисов","folder":"ЛР6","interval":"20s","rules":[rule]}]}
(root/'grafana/provisioning/alerting/rules.json').write_text(json.dumps(alerts,ensure_ascii=False,indent=2)+'\n')
print(f'Дашборд: {len(panels)} панелей. Правило healthcheck подготовлено.')
