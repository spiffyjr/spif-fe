package game

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	homedir "github.com/mitchellh/go-homedir"
	"github.com/spiffyjr/spif-fe/parser"
	"github.com/zserge/lorca"
)

type Game struct {
	conn    net.Conn
	lichCmd *exec.Cmd
	parser  *parser.Parser
	ui      lorca.UI
}

func New() (*Game, error) {
	ui, err := lorca.New("", "", 1280, 1024)
	if err != nil {
		return nil, err
	}

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

	return &Game{ui: ui}, nil
}

func (g *Game) ConnectLich(name string, port int) error {
	g.Disconnect()

	text := fmt.Sprintf("Connecting via Lich to Character %s on port %d\n", name, port)
	g.sendTag(parser.Tag{Name: "text", Text: text})

	conn, err := net.Dial("tcp", fmt.Sprintf("localhost:%d", port))
	if err != nil {
		if err := g.startLich(name, port); err != nil {
			return errors.New("failed to connect to Lich")
		}

		for i := 0; i < 3; i++ {
			g.sendTag(parser.Tag{Name: "text", Text: "Connecting to Lich..."})
			conn, err = net.Dial("tcp", fmt.Sprintf("localhost:%d", port))
			if err == nil {
				break
			}
			time.Sleep(time.Second)
		}

		if err != nil {
			g.sendErrorTag(err)
			return err
		}
	}

	g.conn = conn
	g.connect()
	return nil
}

func (g *Game) ConnectPlayNet(host string, port int, key string) error {
	g.Disconnect()

	text := fmt.Sprintf("Connecting to %s:%d\n", host, port)
	g.sendTag(parser.Tag{Name: "text", Text: text})

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
	g.connect()
	return nil
}

func (g *Game) Run() error {
	g.parser = parser.New(g.sendTag)

	g.ui.Bind("connectLich", func(name string, port int) interface{} {
		return g.ConnectLich(name, port)
	})

	g.ui.Bind("connectPlayNet", func(name string, port int, key string) interface{} {
		return g.ConnectPlayNet(name, port, key)
	})

	g.ui.Bind("connected", func() bool {
		return g.conn != nil
	})

	g.ui.Bind("disconnect", func() {
		g.Disconnect()
	})

	g.ui.Bind("send", func(cmd string) interface{} {
		if g.conn == nil {
			return ErrNotConnected
		}
		if _, err := g.conn.Write([]byte(fmt.Sprintf("%s\r\n", cmd))); err != nil {
			return err
		}
		return nil
	})

	<-g.ui.Done()

	return nil
}

func (g *Game) Disconnect() {
	if g.conn != nil {
		g.conn.Close()
		g.conn = nil
	}
	if g.lichCmd != nil {
		if err := g.lichCmd.Process.Kill(); err != nil {
			log.Println(err)
		}
		g.lichCmd.Wait()
		g.lichCmd = nil
	}
}

func (g *Game) connect() {
	if g.conn == nil {
		return
	}

	scanner := parser.NewScanner(g.conn)

	go func() {
		for scanner.Scan() {
			g.parser.Parse(scanner.Text())
		}

		if err := scanner.Err(); err != nil {
			fmt.Printf("Invalid input: %s\n", err)
		}
	}()
}

func (g *Game) startLich(char string, port int) error {
	var (
		lichPath string
		found    bool
	)

	home, err := homedir.Dir()
	if err != nil {
		return err
	}

	for _, path := range []string{
		os.Getenv("LICH_PATH"),
		filepath.Join(home, "lich"),
		filepath.Join(home, "documents", "lich"),
		filepath.Join(home, "onedrive", "lich"),
		filepath.Join(home, "onedrive", "documents", "lich"),
	} {
		lichPath = filepath.Join(path, "lich.rbw")
		if _, err := os.Stat(lichPath); !os.IsNotExist(err) {
			found = true
			break
		}

		lichPath = filepath.Join(path, "lich.rb")
		if _, err := os.Stat(lichPath); !os.IsNotExist(err) {
			found = true
			break
		}
	}

	if !found {
		return errors.New("failed to find Lich; try setting your LICH_PATH")
	}

	g.lichCmd = exec.Command("ruby", lichPath, "--login", char, "--without-frontend", fmt.Sprintf("--detachable-client=%d", port))
	g.lichCmd.Stdout = os.Stdout
	g.lichCmd.Stderr = os.Stderr

	go func() {
		// TODO: handle me better
		if err := g.lichCmd.Run(); err != nil {
			g.sendErrorTag(err)
		}
	}()

	return nil
}

func (g *Game) sendErrorTag(err error) {
	tag := parser.Tag{
		Name:  "Text",
		Text:  err.Error(),
		Attrs: parser.TagAttributes{"class": "error"},
	}
	g.sendTag(tag)
}

func (g *Game) sendTag(tag parser.Tag) {
	d, err := json.Marshal(&tag)
	if err != nil {
		log.Println(err)
		return
	}
	_ = g.ui.Eval(fmt.Sprintf("ontag(%s)", string(d)))
}
