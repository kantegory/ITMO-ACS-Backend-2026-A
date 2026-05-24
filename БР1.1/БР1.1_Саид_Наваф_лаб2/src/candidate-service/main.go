package main
import ("fmt"; "log"; "net/http"; "os")
func main() {
    port := getEnv("PORT", "8083")
    log.Printf("?? Candidate Service starting on port %s...", port)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status":"ok","service":"candidate-service"}`))
    })
    http.HandleFunc("/service/resumes/", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"id": 1, "applicant_id": 2, "desired_position": "Backend Developer"}`))
    })
    http.HandleFunc("/service/resumes", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`[{"id":1,"applicant_id":2,"desired_position":"Backend"},{"id":2,"applicant_id":2,"desired_position":"Fullstack"},{"id":3,"applicant_id":3,"desired_position":"DevOps"}]`))
    })
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}
func getEnv(key, fallback string) string { if v, ok := os.LookupEnv(key); ok { return v }; return fallback }
