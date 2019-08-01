//go:generate go run -tags generate gen.go
package main

import (
	"log"

	"github.com/spiffyjr/spif-fe/game"
)

func main() {
	g, err := game.New()
	if err != nil {
		log.Fatal(err)
	}
	defer g.Disconnect()

	g.Run()
}
