#!/usr/bin/env python3
"""Серверные метрики за окно нагрузочного теста из Prometheus кластера (через туннель 127.0.0.1:19090).

usage: prom_report.py <end ISO UTC, e.g. 2026-11-10T18:45:00> <window, e.g. 3m>
"""
import json, sys, urllib.parse, urllib.request, datetime as dt

PROM = "http://127.0.0.1:19090"
end = dt.datetime.fromisoformat(sys.argv[1]).replace(tzinfo=dt.timezone.utc).timestamp()
W = sys.argv[2]
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def q(expr):
    url = f"{PROM}/api/v1/query?" + urllib.parse.urlencode({"query": expr, "time": end})
    return json.load(opener.open(url, timeout=20))["data"]["result"]

DEP = 'label_replace({m}, "deployment", "$1", "pod", "(.+)-[a-z0-9]+-[a-z0-9]{{5}}")'
def show(title, expr, label, fmt="{:.3f}", scale=1.0):
    res = q(expr)
    print(f"## {title}")
    for r in sorted(res, key=lambda r: r["metric"].get(label, "")):
        v = float(r["value"][1]) * scale
        print(f"  {r['metric'].get(label, 'total'):<24} {fmt.format(v)}")

show(f"RPS (среднее за {W})", f'sum by (app) (increase(http_requests_total{{namespace="rb"}}[{W}])) / {int(W[:-1]) * 60}', "app", "{:.1f}")
for qn in ("0.50", "0.95", "0.99"):
    show(f"Задержка p{int(float(qn)*100)} на сервере, мс", f'histogram_quantile({qn}, sum by (le, app) (increase(http_request_duration_seconds_bucket{{namespace="rb"}}[{W}])))', "app", "{:.1f}", 1000)
show("Логин p95, мс", f'histogram_quantile(0.95, sum by (le) (increase(http_request_duration_seconds_bucket{{app="auth-service",route="/api/v1/auth/login"}}[{W}])))', "x", "{:.1f}", 1000)
show("Доля 5xx, %", f'100 * sum by (app) (increase(http_requests_total{{namespace="rb",status=~"5.."}}[{W}])) / sum by (app) (increase(http_requests_total{{namespace="rb"}}[{W}]))', "app", "{:.2f}")
show("CPU сервиса: среднее, ядра", 'avg_over_time(sum by (deployment) (' + DEP.format(m='rate(container_cpu_usage_seconds_total{namespace="rb",container!=""}[1m])') + f')[{W}:15s])', "deployment")
show("CPU сервиса: максимум, ядра", 'max_over_time(sum by (deployment) (' + DEP.format(m='rate(container_cpu_usage_seconds_total{namespace="rb",container!=""}[1m])') + f')[{W}:15s])', "deployment")
show("CFS-троттлинг сервиса, %", '100 * sum by (deployment) (' + DEP.format(m=f'increase(container_cpu_cfs_throttled_periods_total{{namespace="rb",container!=""}}[{W}])') + ') / sum by (deployment) (' + DEP.format(m=f'increase(container_cpu_cfs_periods_total{{namespace="rb",container!=""}}[{W}])') + ')', "deployment", "{:.1f}")
show("Память сервиса: максимум, МиБ", 'max_over_time(sum by (deployment) (' + DEP.format(m='container_memory_working_set_bytes{namespace="rb",container!=""}') + f')[{W}:15s])', "deployment", "{:.0f}", 1 / 1048576)
show("Реплики (макс. за окно)", f'max_over_time(kube_deployment_status_replicas_available{{namespace="rb"}}[{W}])', "deployment", "{:.0f}")
