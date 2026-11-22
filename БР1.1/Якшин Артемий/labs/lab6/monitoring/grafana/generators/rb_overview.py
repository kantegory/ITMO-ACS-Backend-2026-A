import json, sys
PROM = {"type": "prometheus", "uid": "prometheus"}
LOKI = {"type": "loki", "uid": "loki"}
pid = 0
def nid():
    global pid; pid += 1; return pid
def row(title, y):
    return {"type": "row", "id": nid(), "title": title, "collapsed": False, "gridPos": {"h": 1, "w": 24, "x": 0, "y": y}, "panels": []}
def tgt(expr, legend="", ref="A", ds=PROM, **kw):
    t = {"datasource": ds, "expr": expr, "legendFormat": legend, "refId": ref}; t.update(kw); return t
def ts(title, targets, x, y, w, h, unit="short", desc="", stack=False, minv=None, maxv=None, draw="line"):
    custom = {"drawStyle": draw, "lineWidth": 1, "fillOpacity": 15 if not stack else 35, "showPoints": "never",
              "spanNulls": True, "stacking": {"mode": "normal" if stack else "none", "group": "A"}}
    if draw == "bars": custom.update({"fillOpacity": 80, "lineWidth": 0})
    d = {"type": "timeseries", "id": nid(), "title": title, "description": desc, "datasource": targets[0]["datasource"],
         "gridPos": {"h": h, "w": w, "x": x, "y": y}, "targets": targets,
         "fieldConfig": {"defaults": {"unit": unit, "custom": custom}, "overrides": []},
         "options": {"legend": {"displayMode": "table", "placement": "right", "calcs": ["lastNotNull", "max"]},
                     "tooltip": {"mode": "multi", "sort": "desc"}}}
    if minv is not None: d["fieldConfig"]["defaults"]["min"] = minv
    if maxv is not None: d["fieldConfig"]["defaults"]["max"] = maxv
    return d
def gauge(title, expr, x, y, w=4, h=5, desc=""):
    return {"type": "gauge", "id": nid(), "title": title, "description": desc, "datasource": PROM,
            "gridPos": {"h": h, "w": w, "x": x, "y": y}, "targets": [tgt(expr)],
            "fieldConfig": {"defaults": {"unit": "percent", "min": 0, "max": 100, "decimals": 1,
                "thresholds": {"mode": "absolute", "steps": [{"color": "green", "value": None}, {"color": "orange", "value": 70}, {"color": "red", "value": 90}]}}, "overrides": []},
            "options": {"reduceOptions": {"calcs": ["lastNotNull"]}, "showThresholdMarkers": True}}
def stat(title, targets, x, y, w, h, unit="short", desc="", mappings=None, thresholds=None, color_mode="value", text_mode="auto", graph="none", decimals=None):
    d = {"type": "stat", "id": nid(), "title": title, "description": desc, "datasource": targets[0]["datasource"],
         "gridPos": {"h": h, "w": w, "x": x, "y": y}, "targets": targets,
         "fieldConfig": {"defaults": {"unit": unit, "mappings": mappings or [],
            "thresholds": thresholds or {"mode": "absolute", "steps": [{"color": "blue", "value": None}]}}, "overrides": []},
         "options": {"reduceOptions": {"calcs": ["lastNotNull"]}, "colorMode": color_mode, "graphMode": graph,
                     "textMode": text_mode, "justifyMode": "center", "orientation": "auto", "wideLayout": True}}
    if decimals is not None: d["fieldConfig"]["defaults"]["decimals"] = decimals
    return d

UPDOWN = [{"type": "value", "options": {"0": {"text": "DOWN", "color": "red", "index": 0}, "1": {"text": "UP", "color": "green", "index": 1}}}]
RG = {"mode": "absolute", "steps": [{"color": "red", "value": None}, {"color": "green", "value": 1}]}
NET = 'container_network_{dir}_bytes_total{{id="/",interface="eth0"}}'
panels = []
y = 0
panels.append(row("Виртуальная машина: CPU, RAM, диск, сеть", y)); y += 1
panels += [
  gauge("CPU (вся ВМ)", '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval])))', 0, y, desc="Загрузка всех vCPU сервера (node-exporter)"),
  gauge("RAM", '100 * (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)', 4, y, desc="Доля занятой памяти (без учёта кэша)"),
  gauge("Диск /", '100 * (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})', 8, y),
  stat("Сеть: вход / выход", [tgt("rate(" + NET.format(dir="receive") + "[$__rate_interval]) * 8", "in", "A"),
                               tgt("rate(" + NET.format(dir="transmit") + "[$__rate_interval]) * 8", "out", "B")],
       12, y, 6, 5, unit="bps", desc="Трафик интерфейса eth0 ВМ (cadvisor, корневой cgroup)", graph="area"),
  stat("Load average / vCPU", [tgt('node_load1', "load1", "A"), tgt('count(count by (cpu) (node_cpu_seconds_total))', "vCPU", "B")],
       18, y, 6, 5, decimals=2),
]
y += 5
panels += [
  ts("CPU по режимам, %", [tgt('100 * avg by (mode) (rate(node_cpu_seconds_total{mode=~"user|system|iowait|steal|softirq|nice"}[$__rate_interval]))', "{{mode}}")],
     0, y, 12, 8, unit="percent", stack=True, minv=0),
  ts("Память", [tgt('node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes', "used", "A"),
                tgt('node_memory_Buffers_bytes + node_memory_Cached_bytes', "buffers+cache", "B"),
                tgt('node_memory_MemTotal_bytes', "total", "C")], 12, y, 12, 8, unit="bytes", minv=0),
]
y += 8
panels += [
  ts("Сеть ВМ (eth0), бит/с", [tgt("rate(" + NET.format(dir="receive") + "[$__rate_interval]) * 8", "receive", "A"),
                               tgt("-rate(" + NET.format(dir="transmit") + "[$__rate_interval]) * 8", "transmit (вниз)", "B")],
     0, y, 12, 8, unit="bps"),
  ts("Диск: ввод-вывод", [tgt('sum(rate(node_disk_read_bytes_total[$__rate_interval]))', "read", "A"),
                          tgt('-sum(rate(node_disk_written_bytes_total[$__rate_interval]))', "write (вниз)", "B")],
     12, y, 12, 8, unit="Bps"),
]
y += 8
panels.append(row("Healthcheck сервисов (blackbox-exporter: GET /health, TCP для RabbitMQ)", y)); y += 1
panels += [
  stat("Доступно сервисов", [tgt('sum(probe_success{job=~"health.*"})', "UP", "A"), tgt('count(probe_success{job=~"health.*"})', "всего", "B")],
       0, y, 4, 6, desc="Сколько проверок из общего числа успешны прямо сейчас", color_mode="none", text_mode="value_and_name"),
  stat("Состояние сервисов", [tgt('max by (service) (probe_success{job=~"health.*"})', "{{service}}")],
       4, y, 20, 6, mappings=UPDOWN, thresholds=RG, color_mode="background", text_mode="value_and_name"),
]
y += 6
panels += [
  {"type": "state-timeline", "id": nid(), "title": "История доступности", "datasource": PROM,
   "gridPos": {"h": 8, "w": 12, "x": 0, "y": y},
   "targets": [tgt('max by (service) (probe_success{job=~"health.*"})', "{{service}}")],
   "fieldConfig": {"defaults": {"mappings": UPDOWN, "thresholds": RG, "color": {"mode": "thresholds"}}, "overrides": []},
   "options": {"showValue": "never", "mergeValues": True, "rowHeight": 0.8, "legend": {"showLegend": False}}},
  ts("Время ответа /health", [tgt('max by (service) (probe_duration_seconds{job=~"health.*"})', "{{service}}")], 12, y, 12, 8, unit="s"),
]
y += 8
panels.append(row("Контейнеры стенда (cadvisor)", y)); y += 1
panels += [
  ts("CPU контейнеров, % ядра", [tgt('100 * sum by (name) (rate(container_cpu_usage_seconds_total{name=~"rb-.*|k3d-rb.*"}[$__rate_interval]))', "{{name}}")],
     0, y, 12, 8, unit="percent", minv=0),
  ts("Память контейнеров (working set)", [tgt('sum by (name) (container_memory_working_set_bytes{name=~"rb-.*|k3d-rb.*"})', "{{name}}")],
     12, y, 12, 8, unit="bytes", minv=0),
]
y += 8
panels.append(row("Приложение (метрики prom-client)", y)); y += 1
panels += [
  ts("Запросы в секунду", [tgt('sum by (service) (rate(http_requests_total[$__rate_interval]))', "{{service}}")], 0, y, 8, 8, unit="reqps", minv=0),
  ts("Задержка p95", [tgt('histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[$__rate_interval])))', "{{service}}")],
     8, y, 8, 8, unit="s", minv=0),
  ts("Ответы 4xx / 5xx в секунду", [tgt('sum by (service, status) (rate(http_requests_total{status=~"[45].."}[$__rate_interval]))', "{{service}} {{status}}")],
     16, y, 8, 8, unit="reqps", minv=0),
]
y += 8
panels.append(row("Логи контейнеров (Loki)", y)); y += 1
panels += [
  ts("Объём логов по контейнерам", [tgt('sum by (container) (count_over_time({container=~"$container"} |~ "(?i)$search" [$__auto]))', "{{container}}", ds=LOKI, queryType="range")],
     0, y, 24, 6, unit="short", stack=True, draw="bars"),
]
y += 6
panels.append({"type": "logs", "id": nid(), "title": "Логи", "datasource": LOKI,
  "gridPos": {"h": 14, "w": 24, "x": 0, "y": y},
  "targets": [tgt('{container=~"$container"} |~ "(?i)$search"', ds=LOKI, queryType="range")],
  "options": {"showTime": True, "showLabels": False, "showCommonLabels": False, "wrapLogMessage": True,
              "prettifyLogMessage": False, "enableLogDetails": True, "sortOrder": "Descending", "dedupStrategy": "none"}})

dash = {
  "uid": "rb-overview", "title": "Restaurant Booking — ВМ, сервисы, логи", "tags": ["restaurant-booking", "lab6"],
  "timezone": "browser", "schemaVersion": 41, "version": 1, "editable": False, "graphTooltip": 1,
  "time": {"from": "now-1h", "to": "now"}, "refresh": "30s",
  "templating": {"list": [
    {"name": "container", "label": "Контейнер", "type": "query", "datasource": LOKI,
     "query": {"label": "container", "refId": "LokiVariableQueryEditor-VariableQuery", "stream": "", "type": 1},
     "definition": "label_values(container)", "refresh": 2, "multi": True, "includeAll": True,
     "current": {"selected": True, "text": ["All"], "value": ["$__all"]}, "allValue": ".+", "sort": 1},
    {"name": "search", "label": "Поиск в логах", "type": "textbox", "query": "", "current": {"text": "", "value": ""}},
  ]},
  "panels": panels,
}
json.dump(dash, open(sys.argv[1], "w"), ensure_ascii=False, indent=2)
print("panels:", len(panels))
