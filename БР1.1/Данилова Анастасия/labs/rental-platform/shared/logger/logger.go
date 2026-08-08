package logger

import (
	"log"
	"os"
)

var std = log.New(os.Stdout, "", log.LstdFlags|log.Lshortfile)

func Info(msg string, args ...any) {
	std.Printf("[INFO] "+msg, args...)
}

func Error(msg string, args ...any) {
	std.Printf("[ERROR] "+msg, args...)
}
