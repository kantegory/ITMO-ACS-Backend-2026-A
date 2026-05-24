package main
import ("fmt"; "log"; "net/http"; "os")
func main() {
    port := getEnv("PORT", "8081")
    log.Printf("?? Auth Service starting on port %s...", port)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok","service":"auth-service"}`))
    })
    http.HandleFunc("/service/users/", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"id": 1, "role": "employer", "is_active": true}`))
    })
    http.HandleFunc("/service/users", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`[{"id":1,"role":"employer","is_active":true},{"id":2,"role":"applicant","is_active":true},{"id":3,"role":"applicant","is_active":false}]`))
    })
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }
