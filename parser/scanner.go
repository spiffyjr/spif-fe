package parser

import (
	"bufio"
	"bytes"
	"io"
)

func dropCR(data []byte) []byte {
	if len(data) > 0 && data[len(data)-1] == '\r' {
		return data[0 : len(data)-1]
	}
	return data
}

func splitCRLF(data []byte, atEOF bool) (advance int, token []byte, err error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
	if i := bytes.Index(data, []byte{'\r', '\n'}); i >= 0 {
		return i + 2, dropCR(data[0:i]), nil
	}
	if atEOF {
		return len(data), dropCR(data), nil
	}
	return 0, nil, nil
}

func NewScanner(rd io.Reader) *bufio.Scanner {
	scanner := bufio.NewScanner(rd)
	scanner.Buffer(make([]byte, 128*1024), 128*1024)
	scanner.Split(splitCRLF)

	return scanner
}
