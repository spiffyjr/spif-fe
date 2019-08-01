package game

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/spiffyjr/spif-fe/parser"
	"github.com/zserge/lorca"
)

type Game struct {
	conn net.Conn
}

func New() (*Game, error) {
	return &Game{}, nil
}

func (g *Game) ConnectTCP(host string, port int) error {
	if g.conn != nil {
		g.conn.Close()
	}

	fmt.Printf("connecting to %s:%d\n", host, port)

	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		return err
	}

	g.conn = conn
	return nil
}

func (g *Game) ConnectPlayNet(host string, port int, key string) error {
	if g.conn != nil {
		g.conn.Close()
	}

	fmt.Printf("connecting to %s:%d\n", host, port)

	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		return err
	}

	if _, err = conn.Write([]byte(key + "\r\n")); err != nil {
		return err
	}

	if _, err = conn.Write([]byte("\r\n")); err != nil {
		return err
	}

	g.conn = conn
	return nil
}

func (g *Game) Run() error {
	ui, err := lorca.New("", "", 1280, 1024)
	if err != nil {
		return err
	}

	ui.Bind("connect", func(host string, port int) interface{} {
		return g.ConnectTCP(host, port)
	})

	ui.Bind("send", func(cmd string) interface{} {
		if g.conn == nil {
			return ErrNotConnected
		}
		if _, err := g.conn.Write([]byte(fmt.Sprintf("%s\r\n", cmd))); err != nil {
			return err
		}
		return nil
	})

	if os.Getenv("DEBUG") != "" {
		ui.Load("http://localhost:4200")
	} else {
		ln, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			log.Fatal(err)
		}
		defer ln.Close()
		go http.Serve(ln, http.FileServer(FS))
		ui.Load(fmt.Sprintf("http://%s", ln.Addr()))
	}

	p := parser.New(func(tag parser.Tag) {
		d, err := json.Marshal(&tag)
		if err != nil {
			log.Println(err)
			return
		}

		_ = ui.Eval(fmt.Sprintf("ontag(%s)", string(d)))
	})

	scanner := parser.NewScanner(g.conn)

	go func() {
		for scanner.Scan() {
			p.Parse(scanner.Text())
		}

		if err := scanner.Err(); err != nil {
			fmt.Printf("Invalid input: %s\n", err)
			ui.Close()
		}
	}()

	<-ui.Done()
	g.Close()

	return nil
}

func (g *Game) Close() {
	if g.conn != nil {
		g.conn.Close()
	}
}
