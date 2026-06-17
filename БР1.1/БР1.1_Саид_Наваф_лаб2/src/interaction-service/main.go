package main
import ("database/sql"; "encoding/json"; "fmt"; "log"; "net/http"; "os"; "strconv"; _ "github.com/lib/pq")
var db *sql.DB
func main() {
    port := getEnv("PORT", "8084")
    dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/main_db?sslmode=disable")
    var err error
    db, err = sql.Open("postgres", dbURL)
    if err != nil { log.Fatal(err) }
    defer db.Close()
    if err = db.Ping(); err != nil { log.Fatal(err) }
    log.Println("Interaction Service DB Connected")
    http.HandleFunc("/health", func(w http.ResponseWriter, req *http.Request) { w.Write([]byte(`{"status":"ok","service":"interaction-service"}`)) })
    http.HandleFunc("/service/applications/", getAppByID)
    http.HandleFunc("/service/applications", getAppsBulk)
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getAppByID(w http.ResponseWriter, req *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    idStr := req.URL.Path[len("/service/applications/"):]
    id, _ := strconv.Atoi(idStr)
    var app struct { ID int `json:"id"`; VacancyID int `json:"vacancy_id"`; ResumeID int `json:"resume_id"`; Status string `json:"status"` }
    err := db.QueryRow("SELECT id, vacancy_id, resume_id, status FROM applications WHERE id = $1", id).Scan(&app.ID, &app.VacancyID, &app.ResumeID, &app.Status)
    if err != nil { http.Error(w, `{"error":"Not Found"}`, 404); return }
    json.NewEncoder(w).Encode(app)
}
func getAppsBulk(w http.ResponseWriter, req *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    limit := req.URL.Query().Get("limit"); n := 10
    if limit != "" { if p, e := strconv.Atoi(limit); e == nil && p > 0 { n = p } }
    rows, err := db.Query("SELECT id, vacancy_id, resume_id, status FROM applications LIMIT $1", n)
    if err != nil { http.Error(w, `{"error":"Error"}`, 500); return }
    defer rows.Close()
    var apps []map[string]interface{}
    for rows.Next() {
        var app struct { ID int; VacancyID int; ResumeID int; Status string }
        rows.Scan(&app.ID, &app.VacancyID, &app.ResumeID, &app.Status)
        apps = append(apps, map[string]interface{}{"id":app.ID,"vacancy_id":app.VacancyID,"resume_id":app.ResumeID,"status":app.Status})
    }
    if apps == nil { apps = []map[string]interface{}{} }
    json.NewEncoder(w).Encode(apps)
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }