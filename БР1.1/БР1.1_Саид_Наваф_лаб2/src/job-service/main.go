package main
import ("fmt"; "log"; "net/http"; "os")
func main() {
    port := getEnv("PORT", "8082")
    log.Printf(" Job Service starting on port %s...", port)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok","service":"job-service"}`))
    })
    http.HandleFunc("/service/vacancies/", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"id": 1, "employer_id": 1, "title": "Go Developer", "is_active": true}`))
    })
    http.HandleFunc("/service/vacancies", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`[{"id":1,"employer_id":1,"title":"Go Dev","is_active":true},{"id":2,"employer_id":1,"title":"Python Dev","is_active":true},{"id":3,"employer_id":2,"title":"Frontend","is_active":false}]`))
    })
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }
