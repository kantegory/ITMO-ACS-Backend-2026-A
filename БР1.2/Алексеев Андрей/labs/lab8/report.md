# Задача

Провести нагрузочные испытания облачного приложения, проанализировать Grafana, настроить HPA и скорректировать requests/limits.

# Ход работы

Подготовлены k6-профили ДЗ10, Grafana panels CPU/RAM/HTTP RPS/p95/5xx и autoscaling/v2 HPA для api-gateway и search-service. HPA использует CPU averageUtilization=65%, minReplicas=1, maxReplicas=3 и stabilizationWindowSeconds=180 для scale-down. У приложений requests=100m CPU/256Mi, limits=1000m/512Mi; это исходные параметры, требующие измерения.

План эксперимента: baseline на фиксированной выборке → stress при наблюдении Grafana/kubectl top → фиксация роста replicas → снижение нагрузки и наблюдение стабилизации → изменение requests/limits по измерениям → повтор того же профиля. Записываются p95/p99, RPS, error rate, OOM/throttling, количество pod и фактическое время масштабирования.

# Проверка и ограничения

HPA-манифесты прошли offline schema validation. Облачный кластер ЛР7 ещё не предоставлен; нагрузочные испытания облака и фактическое увеличение числа pod не выполнялись. Shared VM с FinPlan/VPN не используется для stress. Короткий smoke, даже при успехе, не подтверждает HPA.

# Вывод

Методика испытаний, панели и HPA подготовлены. ЛР8 остаётся незавершённой до запуска в облаке и сравнения измерений до/после настройки ресурсов.
