package parser

import (
	"encoding/xml"
	"fmt"
	"log"
	"sort"
	"strings"
)

type Parser struct {
	ontag TagHandler
	tags  Tags

	styleOpen bool
}

type TagHandler func(tag Tag)

func New(ontag TagHandler) *Parser {
	return &Parser{
		ontag: ontag,
		tags:  Tags{},
	}
}

func init() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
}

func (p *Parser) Error(err error) {
}

func (p *Parser) StartElement(name string, attrs TagAttributes) {
	// start special snowflake handling
	if name == "style" {
		// style tags get set as attributes on regular text tags
		if attrs["id"] == "" {
			p.styleOpen = false
		} else {
			if !p.styleOpen {
				p.tags.Push(Tag{Name: "text", Attrs: TagAttributes{"class": attrs["id"]}})
				p.styleOpen = true
			}
		}
		return
	}

	// inline tags need an empty text node to attach to if the stack is empty
	if p.isInline(name) && len(p.tags) == 0 {
		p.tags.Push(Tag{Name: "text"})
	}

	p.tags.Push(Tag{Name: name, Attrs: attrs})
}

func (p *Parser) EndElement(name string) {
	if name == "style" {
		// handled in StartElement
		return
	}

	tag := p.tags.Pop()
	if p.isInline(tag.Name) {
		// stack is empty add a plain text node for parent
		if len(p.tags) == 0 {
			p.tags.Push(Tag{Name: "text"})
		}

		// add the inline tag as child
		p.tags.Peek().AddChild(tag)
		return
	}

	if len(p.tags) == 0 {
		p.send(tag)
		return
	}

	p.tags.Peek().AddChild(tag)
}

func (p *Parser) Text(text string) {
	if len(p.tags) == 0 {
		p.tags.Push(Tag{Name: "text"})
	}

	p.tags.Peek().Text += text

	// check for ending text tag
	if strings.HasSuffix(text, "\n") {
		tag := p.tags.Pop()
		p.send(tag)
	}
}

func (p *Parser) Parse(line string) {
	// empty lines don't need parsed
	if strings.Replace(line, "\r\n", "", 1) == "" {
		p.ontag(Tag{Name: "text", Text: line})
		return
	}

	// convert pushBold/popBold to <b> tags
	line = strings.Replace(line, "<pushBold/>", "<b>", -1)
	line = strings.Replace(line, "<popBold/>", "</b>", -1)
	line = strings.Replace(line, "<b><b>", "<b>", -1)
	line = strings.Replace(line, "</b></b>", "</b>", -1)

	dec := xml.NewDecoder(strings.NewReader(line))

	for {
		token, err := dec.Token()
		if err != nil {
			break
		}

		switch v := token.(type) {
		case xml.StartElement:
			attrs := TagAttributes{}

			for _, attr := range v.Attr {
				attrs[attr.Name.Local] = attr.Value
			}

			p.StartElement(v.Name.Local, attrs)
		case xml.EndElement:
			p.EndElement(v.Name.Local)
		case xml.CharData:
			p.Text(string(token.(xml.CharData)))
		}
	}

	if len(p.tags) > 0 && p.tags.Peek().Text != "" {
		p.send(p.tags.Pop())
	}
}

func (p *Parser) isInline(name string) bool {
	for _, v := range []string{
		"b",
		"a",
		"d",
		"preset",
	} {
		if name == v {
			return true
		}
	}
	return false
}

func (p *Parser) expandInlineChild(tag Tag) string {
	var (
		attrs  string
		keys   []string
		values []string
	)

	for k, v := range tag.Attrs {
		keys = append(keys, k)
		values = append(values, v)
	}

	sort.Strings(keys)

	for i := range keys {
		attrs += fmt.Sprintf(` %s="%s"`, keys[i], values[i])
	}

	return fmt.Sprintf("<%s%s>%s</%s>", tag.Name, attrs, tag.Text, tag.Name)
}

func (p *Parser) inlineChildren(tag *Tag) Tags {
	if len(tag.Children) == 0 {
		return tag.Children
	}

	// TODO: add toggle to disable link inlining
	var children Tags
	var offset int
	for i := range tag.Children {
		child := tag.Children[i]

		child.Children = p.inlineChildren(&child)

		if !p.isInline(child.Name) {
			children = append(children, child)
			continue
		}

		newText := tag.Text[:child.Start+offset] + p.expandInlineChild(child) + tag.Text[child.End+offset:]
		offset += len(newText) - len(tag.Text)
		tag.Text = newText
	}

	return children
}

func (p *Parser) send(tag Tag) {
	tag.Children = p.inlineChildren(&tag)
	p.ontag(tag)
}
