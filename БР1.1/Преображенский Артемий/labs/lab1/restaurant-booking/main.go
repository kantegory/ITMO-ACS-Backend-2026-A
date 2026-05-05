package main

import (
	"encoding/json"
	"fmt"
	"log"
)

func main() {
	type circle struct {
		X, Y int
	}

	type Wheel struct {
		circle
		Radius int
	}

	var w = Wheel{circle{8, 9}, 3}

	type Movie struct {
		Title  string
		Year   int  `json:"released"`
		Color  bool `json:"color,omitempty"`
		Actors []string
	}

	var movies = []Movie{
		{Title: "Casablanca", Year: 1942, Color: false,
			Actors: []string{"Humphrey Bogart", "Ingrid Bergman"}},
		{Title: "Cool Hand Luke", Year: 1967, Color: true,
			Actors: []string{"Paul Newman"}},
		{Title: "Bullitt", Year: 1968, Color: true,
			Actors: []string{"Steve McQueen", "Jacqueline Bisset"}},
	}

	data, err := json.Marshal(movies)
	if err != nil {
		log.Fatalf("Сбой маршалинга JSON: %s", err)
	}
	fmt.Printf("%s\n", data)

	fmt.Println(w)
}
