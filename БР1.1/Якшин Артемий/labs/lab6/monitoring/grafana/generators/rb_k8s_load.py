import json, sys
K8S = {"type": "prometheus", "uid": "prometheus-k8s"}
VM = {"type": "prometheus", "uid": "prometheus"}
pid = 0
def nid():
    global pid; pid += 1; return pid
def row(t, y): return {"type": "row", "id": nid(), "title": t, "collapsed": False, "gridPos": {"h": 1, "w": 24, "x": 0, "y": y}, "panels": []}
def tgt(expr, legend, ref="A", ds=K8S): return {"datasource": ds, "expr": expr, "legendFormat": legend, "refId": ref}
def ts(title, targets, x, y, w, h, unit="short", desc="", minv=None, maxv=None, step=False, thresholds=None, stack=False):
    custom = {"drawStyle": "line", "lineWidth": 2, "fillOpacity": 10, "showPoints": "never", "spanNulls": True,
              "lineInterpolation": "stepAfter" if step else "linear", "stacking": {"mode": "normal" if stack else "none", "group": "A"}}
    if thresholds: custom["thresholdsStyle"] = {"mode": "line+area"}
    d = {"type": "timeseries", "id": nid(), "title": title, "description": desc, "datasource": targets[0]["datasource"],
         "gridPos": {"h": h, "w": w, "x": x, "y": y}, "targets": targets,
         "fieldConfig": {"defaults": {"unit": unit, "custom": custom}, "overrides": []},
         "options": {"legend": {"displayMode": "table", "placement": "right", "calcs": ["mean", "max"]}, "tooltip": {"mode": "multi", "sort": "desc"}}}
    if minv is not None: d["fieldConfig"]["defaults"]["min"] = minv
    if maxv is not None: d["fieldConfig"]["defaults"]["max"] = maxv
    if thresholds: d["fieldConfig"]["defaults"]["thresholds"] = thresholds
    return d
DEP = 'label_replace({m}, "deployment", "$1", "pod", "(.+)-[a-z0-9]+-[a-z0-9]{{5}}")'
P = []; y = 0
P.append(row("Нагрузка и SLO (метрики приложения, Prometheus в кластере)", y)); y += 1
P += [
  ts("Запросы в секунду по сервисам", [tgt('sum by (app) (rate(http_requests_total{namespace="rb"}[1m]))', "{{app}}")], 0, y, 8, 8, "reqps", minv=0),
  ts("Задержка p95 по сервисам", [tgt('histogram_quantile(0.95, sum by (le, app) (rate(http_request_duration_seconds_bucket{namespace="rb"}[1m])))', "{{app}}")],
     8, y, 8, 8, "s", minv=0,
     thresholds={"mode": "absolute", "steps": [{"color": "transparent", "value": None}, {"color": "red", "value": 0.3}]},
     desc="Красная зона — выше SLO p95 300 мс"),
  ts("Ошибки 5xx, доля", [tgt('sum by (app) (rate(http_requests_total{namespace="rb",status=~"5.."}[1m])) / sum by (app) (rate(http_requests_total{namespace="rb"}[1m]))', "{{app}}")],
     16, y, 8, 8, "percentunit", minv=0),
]
y += 8
P += [
  ts("Gateway: p50 / p95 / p99", [
      tgt('histogram_quantile(0.50, sum by (le) (rate(http_request_duration_seconds_bucket{app="gateway"}[1m])))', "p50", "A"),
      tgt('histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{app="gateway"}[1m])))', "p95", "B"),
      tgt('histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket{app="gateway"}[1m])))', "p99", "C")],
     0, y, 12, 8, "s", minv=0),
  ts("Логин (auth-service): p95 и запросы/с", [
      tgt('histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{app="auth-service",route="/api/v1/auth/login"}[1m])))', "p95 login", "A"),
      tgt('sum(rate(http_requests_total{app="auth-service",route="/api/v1/auth/login"}[1m]))', "login/s", "B")],
     12, y, 12, 8, "short", minv=0),
]
y += 8
P.append(row("Автоскейлинг (HPA)", y)); y += 1
P += [
  ts("Реплики Deployment (доступные)", [tgt('kube_deployment_status_replicas_available{namespace="rb"}', "{{deployment}}")], 0, y, 8, 8, "short", minv=0, step=True),
  ts("HPA: текущие / желаемые реплики", [
      tgt('kube_horizontalpodautoscaler_status_current_replicas{namespace="rb"}', "{{horizontalpodautoscaler}} current", "A"),
      tgt('kube_horizontalpodautoscaler_status_desired_replicas{namespace="rb"}', "{{horizontalpodautoscaler}} desired", "B")],
     8, y, 8, 8, "short", minv=0, step=True),
  ts("CPU сервиса, % от requests (то, что видит HPA)", [tgt(
      '100 * sum by (deployment) (' + DEP.format(m='rate(container_cpu_usage_seconds_total{namespace="rb",container="app"}[1m])') + ') / sum by (deployment) (' + DEP.format(m='kube_pod_container_resource_requests{namespace="rb",resource="cpu",container="app"}') + ')',
      "{{deployment}}")], 16, y, 8, 8, "percent", minv=0,
     thresholds={"mode": "absolute", "steps": [{"color": "transparent", "value": None}, {"color": "orange", "value": 70}]},
     desc="Оранжевая линия — цель HPA averageUtilization=70 %"),
]
y += 8
P.append(row("Ресурсы подов (cAdvisor kubelet)", y)); y += 1
P += [
  ts("CPU подов, ядра", [tgt('sum by (pod) (rate(container_cpu_usage_seconds_total{namespace="rb",container!=""}[1m]))', "{{pod}}")], 0, y, 8, 9, "short", minv=0),
  ts("CFS-троттлинг подов, %", [tgt('100 * sum by (pod) (rate(container_cpu_cfs_throttled_periods_total{namespace="rb",container!=""}[1m])) / sum by (pod) (rate(container_cpu_cfs_periods_total{namespace="rb",container!=""}[1m]))', "{{pod}}")],
     8, y, 8, 9, "percent", minv=0, desc="Доля периодов CFS, в которых контейнер упёрся в limits.cpu"),
  ts("Память подов (working set)", [tgt('sum by (pod) (container_memory_working_set_bytes{namespace="rb",container!=""})', "{{pod}}")], 16, y, 8, 9, "bytes", minv=0),
]
y += 9
P.append(row("Узел k3d и сервер (Prometheus ЛР6)", y)); y += 1
P += [
  ts("CPU узла k3d, ядра (потолок 1.5)", [
      tgt('sum(rate(container_cpu_usage_seconds_total{name="k3d-rb-server-0"}[1m]))', "k3d-rb-server-0", "A", VM)],
     0, y, 8, 8, "short", minv=0, maxv=2,
     thresholds={"mode": "absolute", "steps": [{"color": "transparent", "value": None}, {"color": "red", "value": 1.5}]}),
  ts("Троттлинг узла k3d, %", [tgt('100 * rate(container_cpu_cfs_throttled_periods_total{name="k3d-rb-server-0"}[1m]) / rate(container_cpu_cfs_periods_total{name="k3d-rb-server-0"}[1m])', "k3d-rb-server-0", "A", VM)],
     8, y, 8, 8, "percent", minv=0),
  ts("Загрузка ядер хоста, % (0–1 — соседний проект, 2–3 — стенд)", [tgt('100 * (1 - avg by (cpu) (rate(node_cpu_seconds_total{mode="idle"}[1m])))', "cpu{{cpu}}", "A", VM)],
     16, y, 8, 8, "percent", minv=0, maxv=100),
]
y += 8
P.append(row("Генератор нагрузки k6 (remote write)", y)); y += 1
P += [
  ts("k6: VU и итерации/с", [tgt('sum(k6_vus)', "VUs", "A"), tgt('sum(rate(k6_iterations_total[1m]))', "iterations/s", "B")], 0, y, 12, 7, "short", minv=0),
  ts("k6: запросы/с и p95 на клиенте", [tgt('sum(rate(k6_http_reqs_total[1m]))', "req/s", "A"), tgt('max(k6_http_req_duration_p95) * 1000', "p95, мс (клиент, с RTT)", "B")], 12, y, 12, 7, "short", minv=0),
]
dash = {"uid": "rb-k8s-load", "title": "Restaurant Booking — Kubernetes: нагрузка и автоскейлинг", "tags": ["restaurant-booking", "lab8"],
        "timezone": "browser", "schemaVersion": 41, "version": 1, "editable": False, "graphTooltip": 1,
        "time": {"from": "now-30m", "to": "now"}, "refresh": "10s", "templating": {"list": []}, "panels": P}
json.dump(dash, open(sys.argv[1], "w"), ensure_ascii=False, indent=2); print("panels", len(P))
