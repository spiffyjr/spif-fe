package game

import (
	"bufio"
	"fmt"
	"net"
	"regexp"
	"strings"
	"time"
)

type PlayNet struct {
	conn      net.Conn
	rd        *bufio.Reader
	instances []PlayNetInstance
}

type PlayNetInstance struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type PlayNetCharacter struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type PlayNetLogin struct {
	Host string `json:"host"`
	Port int    `json:"port"`
	Key  string `json:"key"`
}

func NewPlayNet() *PlayNet {
	return &PlayNet{}
}

func (p *PlayNet) GetLoginData(code string, characterID string) (*PlayNetLogin, error) {
	if p.conn == nil {
		return nil, ErrNotConnected
	}

	// set 5 second timeouts on all calls
	p.conn.SetReadDeadline(time.Now().Add(time.Second * 5))
	p.conn.SetWriteDeadline(time.Now().Add(time.Second * 5))

	if _, err := p.conn.Write([]byte(fmt.Sprintf("F\t%s\r\n", code))); err != nil {
		return nil, err
	}

	line, err := p.rd.ReadString('\n')
	if err != nil {
		return nil, err
	}

	parts := strings.Split(line, "\t")
	if len(parts) < 2 || (parts[1] == "EXPIRED" || parts[1] == "NEW_TO_GAME") {
		return nil, ErrInvalidSubscription
	}

	if _, err = p.conn.Write([]byte(fmt.Sprintf("G\t%s\r\n", code))); err != nil {
		return nil, err
	}
	if line, err = p.rd.ReadString('\n'); err != nil {
		return nil, err
	}

	if _, err := p.conn.Write([]byte(fmt.Sprintf("L\t%s\tSTORM\r\n", characterID))); err != nil {
		return nil, err
	}
	line, err = p.rd.ReadString('\n')
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`GAMEHOST=([^\s]+)\s+GAMEPORT=([^\s]+)\s+KEY=([^\s]+)`)
	matches := re.FindStringSubmatch(line)

	return &PlayNetLogin{
		Host: matches[1],
		Port: 10024,
		Key:  matches[3],
	}, nil
}

func (p *PlayNet) GetCharacters(code string) ([]PlayNetCharacter, error) {
	if p.conn == nil {
		return nil, ErrNotConnected
	}

	// set 30 second timeouts on all calls
	p.conn.SetReadDeadline(time.Now().Add(time.Second * 30))
	p.conn.SetWriteDeadline(time.Now().Add(time.Second * 30))

	if _, err := p.conn.Write([]byte(fmt.Sprintf("F\t%s\r\n", code))); err != nil {
		return nil, err
	}

	line, err := p.rd.ReadString('\n')
	if err != nil {
		return nil, err
	}

	parts := strings.Split(line, "\t")
	if len(parts) < 2 || (parts[1] == "EXPIRED" || parts[1] == "NEW_TO_GAME") {
		return nil, ErrInvalidSubscription
	}

	if _, err = p.conn.Write([]byte(fmt.Sprintf("G\t%s\r\n", code))); err != nil {
		return nil, err
	}
	if line, err = p.rd.ReadString('\n'); err != nil {
		return nil, err
	}

	if _, err = p.conn.Write([]byte(fmt.Sprintf("P\t%s\r\n", code))); err != nil {
		return nil, err
	}
	if line, err = p.rd.ReadString('\n'); err != nil {
		return nil, err
	}

	if _, err = p.conn.Write([]byte("C\r\n")); err != nil {
		return nil, err
	}
	if line, err = p.rd.ReadString('\n'); err != nil {
		return nil, err
	}

	var characters []PlayNetCharacter

	parts = strings.Split(line, "\t")
	for i := 5; i < len(parts); {
		characters = append(characters, PlayNetCharacter{ID: parts[i], Name: parts[i+1]})
		i += 2
	}

	return characters, nil
}

func (p *PlayNet) GetInstances() ([]PlayNetInstance, error) {
	if p.conn == nil {
		return nil, ErrNotConnected
	} else if len(p.instances) > 0 {
		return p.instances, nil
	}

	// set 30 second timeouts on all calls
	p.conn.SetReadDeadline(time.Now().Add(time.Second * 30))
	p.conn.SetWriteDeadline(time.Now().Add(time.Second * 30))

	if _, err := p.conn.Write([]byte("M\r\n")); err != nil {
		return nil, err
	}

	line, err := p.rd.ReadString('\n')
	if err != nil {
		return nil, err
	}

	parts := strings.Split(line, "\t")
	for i := 1; i < len(parts); {
		code := parts[i]
		name := parts[i+1]

		i += 2

		if _, err = p.conn.Write([]byte(fmt.Sprintf("N\t%s\r\n", code))); err != nil {
			return nil, err
		}

		if line, err = p.rd.ReadString('\n'); err != nil {
			return nil, err
		}
		gameParts := strings.Split(line, "\t")
		gameParts = strings.Split(gameParts[1], "|")

		if gameParts[0] == "DEVELOPMENT" {
			continue
		}

		p.instances = append(p.instances, PlayNetInstance{Code: code, Name: name})
	}

	return p.instances, nil
}

func (p *PlayNet) Connect(username string, password []byte) error {
	conn, err := net.Dial("tcp", "eaccess.play.net:7900")
	if err != nil {
		return err
	}

	if len(password) > 32 {
		return ErrPasswordTooLong
	}

	// set 30 second timeouts on all calls
	conn.SetReadDeadline(time.Now().Add(time.Second * 30))
	conn.SetWriteDeadline(time.Now().Add(time.Second * 30))

	p.rd = bufio.NewReader(conn)

	if _, err = conn.Write([]byte("K\r\n")); err != nil {
		return err
	}

	hash, err := p.rd.ReadBytes('\n')
	if err != nil {
		return err
	}

	for i := range password {
		password[i] = ((password[i] - 0x20) ^ hash[i]) + 0x20
	}

	if _, err = conn.Write([]byte(fmt.Sprintf("A\t%s\t%s\r\n", username, password))); err != nil {
		return err
	}

	line, err := p.rd.ReadString('\n')
	if err != nil {
		return err
	}

	parts := strings.Split(line, "\t")
	if len(parts) == 3 {
		if strings.HasPrefix(parts[2], "REJECT") {
			return ErrNotSubscribed
		} else if strings.HasPrefix(parts[2], "PASSWORD") {
			return ErrInvalidCredentials
		}
	} else if len(parts) < 4 {
		return ErrUnknownResponse
	} else if parts[2] != "KEY" {
		return ErrUnknownResponse
	}

	p.conn = conn
	return nil
}

func (p *PlayNet) Disconnect() {
	p.instances = []PlayNetInstance{}

	if p.conn != nil {
		p.conn.Close()
		p.conn = nil
	}
}
