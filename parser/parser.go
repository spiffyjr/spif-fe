package parser

import (
	"encoding/xml"
	"strings"
)

type Parser struct {
	ontag TagHandler
	tags  *Tags

	boldOpen  bool
	styleOpen bool
}

type TagHandler func(tag Tag)

func New(ontag TagHandler) *Parser {
	return &Parser{
		ontag: ontag,
		tags:  &Tags{},
	}
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
	} else if name == "b" || name == "pushBold" {
		if !p.boldOpen {
			p.boldOpen = true
		}
		return
	} else if name == "popBold" {
		// skip, handled by EndElement
		return
	}

	tag := Tag{Name: name, Attrs: attrs}

	// starting a new element with text on the stack, pop it off
	if !p.isInline(tag.Name) && p.tags.Len() > 0 && p.tags.Peek().Name == "text" {
		p.send(p.tags.Pop())
	}

	p.tags.Push(tag)
}

func (p *Parser) EndElement(name string) {
	if name == "style" {
		// handled in StartElement
		return
	} else if name == "b" || name == "popBold" {
		if p.boldOpen {
			p.boldOpen = false
		}

		// <pushBold> with <a> gets the npc class added
		lastTag := p.tags.Peek()
		if lastTag != nil {
			lastChild := lastTag.Children.Peek()
			if lastChild != nil && lastChild.Name == "a" {
				lastChild.Attrs["class"] = "npc"
			}
		}
		return
	} else if name == "pushBold" {
		// skip, handled by StartElement
		return
	}

	tag := p.tags.Pop()
	if p.isInline(tag.Name) {
		// stack is empty add a plain text node for parent
		if p.tags.Len() == 0 {
			p.tags.Push(Tag{Name: "text"})
		}

		// add the inline tag as child
		p.tags.Peek().AddChild(tag)
		return
	}

	if p.tags.Len() == 0 {
		p.send(tag)
		return
	}

	p.tags.Peek().AddChild(tag)
}

func (p *Parser) Text(text string) {
	if p.tags.Len() == 0 {
		p.tags.Push(Tag{Name: "text"})
	}

	p.tags.Peek().Text += text

	// check for ending text tag
	if strings.HasSuffix(text, "\n") {
		tag := p.tags.Pop()
		// skip end of element \r\n text
		// if strings.TrimSpace(tag.Text) == "" {
		// return
		// }
		p.send(tag)
	}
}

func (p *Parser) Parse(line string) {
	// empty lines don't need parsed
	if strings.Replace(line, "\r\n", "", 1) == "" {
		p.ontag(Tag{Name: "text", Text: line})
		return
	}

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

	if p.tags.Len() > 0 && p.tags.Peek().Text != "" {
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

func (p *Parser) send(tag Tag) {
	p.ontag(tag)
}
