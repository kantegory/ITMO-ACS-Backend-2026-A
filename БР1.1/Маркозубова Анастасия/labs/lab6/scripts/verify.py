#!/usr/bin/env python3
import base64
import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parent.parent
env = dict(line.split("=", 1) for line in (root / ".env").read_text().splitlines() if "=" in line)
auth = base64.b64encode(f"admin:{env['GRAFANA_ADMIN_PASSWORD']}".encode()).decode()
base = "http://127.0.0.1:3030"
services = {"auth", "profile", "resume", "vacancy", "application", "reference"}

def api(path, params=None):
    query = "?" + urlencode(params) if params else ""
    request = Request(base + path + query, headers={"Authorization": "Basic " + auth})
    with urlopen(request, timeout=5) as response:
        return json.load(response)

def prom(query):
    return api("/api/datasources/proxy/uid/lab6-prom/api/v1/query", {"query": query})["data"]["result"]

def verify():
    dashboard = api("/api/dashboards/uid/lab6-backend")["dashboard"]
    metrics = {}
    for panel in dashboard["panels"][:4]:
        for target in panel["targets"]:
            samples = prom(target["expr"])
            assert samples, f"No data for {panel['title']} / {target['refId']}"
            value = float(samples[0]["value"][1])
            assert 0 <= value < float("inf"), f"Invalid metric: {value}"
            metrics[f"{panel['title']} / {target['refId']}"] = round(value, 2)
    probes = {x["metric"]["service"]: int(x["value"][1]) for x in prom('probe_success{job="microservices"}')}
    assert probes == dict.fromkeys(services, 1), f"Probes: {probes}"
    log_path = "/api/datasources/proxy/uid/lab6-loki/loki/api/v1"
    start = str(time.time_ns() - 24*3600*10**9)
    logs = api(log_path + "/query_range", {"query": '{job="docker",container=~"backend-lab4-.*"}', "limit": 20, "start": start})
    log_containers = api(log_path + "/label/container/values", {"start": start})["data"]
    assert logs["data"]["result"], "No application logs in Loki"
    rules = api("/api/v1/provisioning/alert-rules")
    assert {r["labels"]["service"] for r in rules if r["uid"].startswith("lab6-health-")} == services
    return {"collected_at_utc": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()), "dashboard": dashboard["uid"], "metrics": metrics, "probes": probes, "containers_with_logs": len(log_containers), "application_containers_with_logs": len([c for c in log_containers if c.startswith("backend-lab4-")]), "alert_rules": len(services)}

for attempt in range(36):
    try:
        print(json.dumps(verify(), indent=2, ensure_ascii=False))
        break
    except (AssertionError, OSError, KeyError, ValueError) as exc:
        if attempt == 35:
            raise SystemExit(f"Monitoring verification failed: {exc}") from exc
        time.sleep(5)
