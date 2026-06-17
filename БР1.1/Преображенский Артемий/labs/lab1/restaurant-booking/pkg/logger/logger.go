package logger

import (
	"log"
	"os"
)

var L = log.New(os.Stdout, "", log.LstdFlags)

