package parser

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/suite"
)

func fileTags(filename string) []Tag {
	r, err := os.Open(fmt.Sprintf("./testdata/%s.xml", filename))
	if err != nil {
		log.Fatal(err)
	}
	defer r.Close()

	var tags []Tag

	p := New(func(tag Tag) {
		tags = append(tags, tag)
	})

	scanner := NewScanner(r)

	for scanner.Scan() {
		p.Parse(scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	return tags
}

func fileTagsJSON(filename string) []Tag {
	r, err := os.Open(fmt.Sprintf("./testdata/%s.json", filename))
	if err != nil {
		log.Fatal(err)
	}
	defer r.Close()

	var tags []Tag

	p := New(func(tag Tag) {
		tags = append(tags, tag)
	})

	var str string
	if err := json.NewDecoder(r).Decode(&str); err != nil {
		log.Fatal(err)
	}

	scanner := NewScanner(strings.NewReader(str))

	for scanner.Scan() {
		p.Parse(scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	return tags
}

type ParserSuite struct {
	suite.Suite
}

func (s *ParserSuite) TestEmptyLine() {
	var tags []Tag
	p := New(func(tag Tag) {
		tags = append(tags, tag)
	})
	p.Parse("\r\n")

	if !s.Len(tags, 1) {
		return
	}

	s.Equal("text", tags[0].Name)
	s.Equal("\r\n", tags[0].Text)
}

func (s *ParserSuite) TestLook() {
	tags := fileTags("advanced/look")

	if !s.Len(tags, 3) {
		return
	}

	// tag one - room name (no children)
	s.Equal("text", tags[0].Name)
	s.Equal("roomName", tags[0].Attrs["class"])

	if !s.Len(tags[0].Children, 0) {
		return
	}

	// tag two - roomDesc
	s.Equal("text", tags[1].Name)
	s.Equal("roomDesc", tags[1].Attrs["class"])

	if !s.Len(tags[1].Children, 0) {
		return
	}

	// tag three - obvious paths
	s.Equal("text", tags[2].Name)

	if !s.Len(tags[2].Children, 0) {
		return
	}
}

func (s *ParserSuite) TestBold() {
	tags := fileTags("simple/bold")

	if !s.Len(tags, 2) {
		return
	}

	tag := tags[0]

	for expected, actual := range map[string]interface{}{
		"text": tag.Name,
		"If you are sure you want to see BOLD then <b>CONFIRM</b> me.": tag.Text,
	} {
		s.Equal(expected, actual)
	}
}

func (s *ParserSuite) TestChild() {
	tags := fileTags("simple/child_node")

	if !s.Len(tags, 1) {
		return
	}

	s.Equal("compass", tags[0].Name)

	if !s.Len(tags[0].Children, 2) {
		return
	}

	s.Equal("dir", tags[0].Children.Peek().Name)
}

func (s *ParserSuite) TestInline() {
	tags := fileTags("simple/inline")

	if !s.Len(tags, 2) {
		return
	}

	tag := tags[1]
	if !s.Len(tag.Children, 0) {
		return
	}

	for expected, actual := range map[string]interface{}{
		"text": tag.Name,
		`<a exist="-11051085" noun="Kips">Kips</a>, your Combat Maneuver training is as follows:`: tag.Text,
	} {
		s.Equal(expected, actual)
	}
}

func (s *ParserSuite) TestMultiInline() {
	tags := fileTags("simple/multiinline")

	if !s.Len(tags, 1) {
		return
	}

	tag := tags[0]
	if !s.Len(tag.Children, 0) {
		return
	}

	for expected, actual := range map[string]interface{}{
		"text": tag.Name,
		`<a exist="-11051085" noun="Kips">Kips</a>, hi there buddy.  Would you like <a exist="1234" noun="Coffee">some coffee</a>?`: tag.Text,
	} {
		s.Equal(expected, actual)
	}
}

func (s *ParserSuite) TestPlainText() {
	tags := fileTagsJSON("simple/plain_text")

	if !s.Len(tags, 1) {
		return
	}

	for expected, actual := range map[string]interface{}{
		"text": tags[0].Name,
		"Available Combat Maneuver Training Points: 40\nTotal Points converted during your current 30-day unlearning cycle: 1\nNumber of days remaining in your current 30-day unlearning cycle: 18 days": tags[0].Text,
	} {
		s.Equal(expected, actual)
	}
}

func (s *ParserSuite) TestMultiBold() {
	tags := fileTags("simple/multi_bold")

	if !s.Len(tags, 5) {
		return
	}

	for expected, actual := range map[string]interface{}{
		"text": tags[2].Name,
		`<b>A <a exist="201318404" noun="puma">puma</a></b> tries to bite you!`: tags[2].Text,
	} {
		s.Equal(expected, actual)
	}
}

func (s *ParserSuite) TestNPC() {
	tags := fileTags("simple/npc")
	if !s.Len(tags, 2) {
		return
	}

	for expected, actual := range map[string]interface{}{
		"text": tags[0].Name,
		`<b>A <a exist="200167454" noun="child">young human child</a></b> arrives, following you.`: tags[0].Text,
	} {
		s.Equal(expected, actual)
	}

	for expected, actual := range map[string]interface{}{
		"text": tags[1].Name,
		`You also see <b>a <a exist="79410" noun="barker">gnome barker</a></b>.`: tags[1].Text,
	} {
		s.Equal(expected, actual)
	}
}

func (s *ParserSuite) TestStyle() {
	tags := fileTags("simple/style")
	if !s.Len(tags, 2) {
		return
	}

	if !s.NotNil(tags[0].Attrs["class"]) {
		return
	}

	if !s.NotNil(tags[1].Attrs["class"]) {
		return
	}

	for expected, actual := range map[string]interface{}{
		"text":                             tags[0].Name,
		"roomName":                         tags[0].Attrs["class"],
		"[Commerce Burrow, Giantman Path]": tags[0].Text,
	} {
		s.Equal(expected, actual)
	}

	for expected, actual := range map[string]interface{}{
		"text":                   tags[1].Name,
		"roomDesc":               tags[1].Attrs["class"],
		"A room desc goes here.": tags[1].Text,
	} {
		s.Equal(expected, actual)
	}
}

func TestParser(t *testing.T) {
	suite.Run(t, new(ParserSuite))
}
