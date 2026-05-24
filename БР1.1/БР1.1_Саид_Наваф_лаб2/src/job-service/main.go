package main
import ("database/sql"; "encoding/json"; "fmt"; "log"; "net/http"; "os"; "strconv"; _ "github.com/lib/pq")
var db *sql.DB
func main() {
    port := getEnv("PORT", "8082")
    dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/main_db?sslmode=disable")
    var err error
    db, err = sql.Open("postgres", dbURL)
    if err != nil { log.Fatal(err) }
    defer db.Close()
    if err = db.Ping(); err != nil { log.Fatal(err) }
    log.Println("Job Service DB Connected")
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(`{"status":"ok","service":"job-service"}`)) })
    http.HandleFunc("/service/vacancies/", getVacancyByID)
    http.HandleFunc("/service/vacancies", getVacanciesBulk)
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getVacancyByID(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    idStr := r.URL.Path[len("/service/vacancies/"):]
    id, _ := strconv.Atoi(idStr)
    var v struct { ID int `json:"id"`; EmployerID int `json:"employer_id"`; Title string `json:"title"`; IsActive bool `json:"is_active"` }
    err := db.QueryRow("SELECT id, employer_id, title, is_active FROM vacancies WHERE id = $1", id).Scan(&v.ID, &v.EmployerID, &v.Title, &v.IsActive)
    if err != nil { http.Error(w, `{"error":"Not Found"}`, 404); return }
    json.NewEncoder(w).Encode(v)
}
func getVacanciesBulk(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    limit := r.URL.Query().Get("limit"); n := 10
    if limit != "" { if p, e := strconv.Atoi(limit); e == nil && p > 0 { n = p } }
    rows, err := db.Query("SELECT id, employer_id, title, is_active FROM vacancies LIMIT $1", n)
    if err != nil { http.Error(w, `{"error":"Error"}`, 500); return }
    defer rows.Close()
    var vacs []map[string]interface{}
    for rows.Next() {
        var v struct { ID int; EmployerID int; Title string; IsActive bool }
        rows.Scan(&v.ID, &v.EmployerID, &v.Title, &v.IsActive)
        vacs = append(vacs, map[string]interface{}{"id":v.ID,"employer_id":v.EmployerID,"title":v.Title,"is_active":v.IsActive})
    }
    if vacs == nil { vacs = []map[string]interface{}{} }
    json.NewEncoder(w).Encode(vacs)
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }