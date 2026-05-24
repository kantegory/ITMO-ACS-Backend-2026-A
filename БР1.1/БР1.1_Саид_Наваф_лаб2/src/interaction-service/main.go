package main
import ("fmt"; "log"; "net/http"; "os")
func main() {
    port := getEnv("PORT", "8084")
    log.Printf("?? Interaction Service starting on port %s...", port)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok","service":"interaction-service"}`))
    })
    http.HandleFunc("/service/applications/", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"id": 1, "vacancy_id": 1, "resume_id": 1, "status": "pending"}`))
    })
    http.HandleFunc("/service/applications", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`[{"id":1,"vacancy_id":1,"resume_id":1,"status":"pending"},{"id":2,"vacancy_id":2,"resume_id":2,"status":"approved"},{"id":3,"vacancy_id":1,"resume_id":3,"status":"rejected"}]`))
    })
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }
