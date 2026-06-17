package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    _ "github.com/lib/pq"
)

var db *sql.DB

func main() {
    port := getEnv("PORT", "8081")
    dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/main_db?sslmode=disable")

    var err error
    db, err = sql.Open("postgres", dbURL)
    if err != nil {
        log.Fatal("DB Open Error:", err)
    }
    defer db.Close()

    if err = db.Ping(); err != nil {
        log.Fatal("DB Ping Error:", err)
    }
    log.Println("DB Connected")

    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte(`{"status":"ok","service":"auth-service"}`))
    })

    http.HandleFunc("/service/users/", getUserByID)
    http.HandleFunc("/service/users", getUsersBulk)

    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func getUserByID(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    idStr := r.URL.Path[len("/service/users/"):]
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, `{"error":"Bad Request"}`, 400)
        return
    }

    var user struct {
        ID       int    `json:"id"`
        Email    string `json:"email"`
        Role     string `json:"role"`
        IsActive bool   `json:"is_active"`
    }

    err = db.QueryRow("SELECT id, email, role, is_active FROM users WHERE id = $1", id).Scan(&user.ID, &user.Email, &user.Role, &user.IsActive)
    if err != nil {
        http.Error(w, `{"error":"Not Found"}`, 404)
        return
    }
    json.NewEncoder(w).Encode(user)
}

func getUsersBulk(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    limit := r.URL.Query().Get("limit")
    n := 10
    if limit != "" {
        if parsed, err := strconv.Atoi(limit); err == nil && parsed > 0 {
            n = parsed
        }
    }

    rows, err := db.Query("SELECT id, email, role, is_active FROM users LIMIT $1", n)
    if err != nil {
        http.Error(w, `{"error":"Internal Error"}`, 500)
        return
    }
    defer rows.Close()

    var users []map[string]interface{}
    for rows.Next() {
        var u struct { ID int; Email string; Role string; IsActive bool }
        rows.Scan(&u.ID, &u.Email, &u.Role, &u.IsActive)
        users = append(users, map[string]interface{}{"id": u.ID, "email": u.Email, "role": u.Role, "is_active": u.IsActive})
    }
    if users == nil { users = []map[string]interface{}{} }
    json.NewEncoder(w).Encode(users)
}

func getEnv(key, fallback string) string {
    if v, ok := os.LookupEnv(key); ok { return v }
    return fallback
}