//+build generate

package main

import (
	"log"
	"os"
	"os/exec"

	"github.com/zserge/lorca"
)

func main() {
	// You can also run "npm build" or webpack here, or compress assets, or
	// generate manifests, or do other preparations for your assets.
	cmd := exec.Command("npm", "i")
	cmd.Dir = "ui"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}

	cmd = exec.Command("npm", "run", "build")
	cmd.Dir = "ui"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}
	lorca.Embed("game", "game/assets.go", "ui/dist/spif-fe")
}
