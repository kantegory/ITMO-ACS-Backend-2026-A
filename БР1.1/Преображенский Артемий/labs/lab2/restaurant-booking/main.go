package main

import "fmt"

func remove(slice []int, index int) []int {
	copy(slice[index:], slice[index+1:])
	return slice[:len(slice)-1]
}

func main() {
	ages := map[int]string{}
	fmt.Print(ages)
	ages[1] = "sdd"
	fmt.Print(ages)
}
