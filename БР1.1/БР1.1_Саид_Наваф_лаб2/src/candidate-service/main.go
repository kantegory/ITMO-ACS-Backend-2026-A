package main
import ("database/sql"; "encoding/json"; "fmt"; "log"; "net/http"; "os"; "strconv"; _ "github.com/lib/pq")
var db *sql.DB
func main() {
    port := getEnv("PORT", "8083")
    dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/main_db?sslmode=disable")
    var err error
    db, err = sql.Open("postgres", dbURL)
    if err != nil { log.Fatal(err) }
    defer db.Close()
    if err = db.Ping(); err != nil { log.Fatal(err) }
    log.Println("Candidate Service DB Connected")
    http.HandleFunc("/health", func(w http.ResponseWriter, req *http.Request) { w.Write([]byte(`{"status":"ok","service":"candidate-service"}`)) })
    http.HandleFunc("/service/resumes/", getResumeByID)
    http.HandleFunc("/service/resumes", getResumesBulk)
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getResumeByID(w http.ResponseWriter, req *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    idStr := req.URL.Path[len("/service/resumes/"):]
    id, _ := strconv.Atoi(idStr)
    var resume struct { ID int `json:"id"`; ApplicantID int `json:"applicant_id"`; Position string `json:"desired_position"`; IsActive bool `json:"is_active"` }
    err := db.QueryRow("SELECT id, applicant_id, desired_position, is_active FROM resumes WHERE id = $1", id).Scan(&resume.ID, &resume.ApplicantID, &resume.Position, &resume.IsActive)
    if err != nil { http.Error(w, `{"error":"Not Found"}`, 404); return }
    json.NewEncoder(w).Encode(resume)
}
func getResumesBulk(w http.ResponseWriter, req *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    limit := req.URL.Query().Get("limit"); n := 10
    if limit != "" { if p, e := strconv.Atoi(limit); e == nil && p > 0 { n = p } }
    rows, err := db.Query("SELECT id, applicant_id, desired_position, is_active FROM resumes LIMIT $1", n)
    if err != nil { http.Error(w, `{"error":"Error"}`, 500); return }
    defer rows.Close()
    var res []map[string]interface{}
    for rows.Next() {
        var resume struct { ID int; ApplicantID int; Position string; IsActive bool }
        rows.Scan(&resume.ID, &resume.ApplicantID, &resume.Position, &resume.IsActive)
        res = append(res, map[string]interface{}{"id":resume.ID,"applicant_id":resume.ApplicantID,"desired_position":resume.Position,"is_active":resume.IsActive})
    }
    if res == nil { res = []map[string]interface{}{} }
    json.NewEncoder(w).Encode(res)
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }