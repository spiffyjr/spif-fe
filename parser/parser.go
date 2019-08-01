package parser

import (
	"encoding/xml"
	"fmt"
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

	tag := Tag{Name: name, Attrs: attrs}

	// starting a new element with text on the stack, pop it off
	// if !p.isInline(tag.Name) && len(p.tags) > 0 && p.tags.Peek().Name == "text" {
	// 	p.send(p.tags.Pop())
	// }

	p.tags.Push(tag)
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

func (p *Parser) expandInlineChild(tag TagChild) string {
	var attrs string

	for k, v := range tag.Attrs {
		attrs += fmt.Sprintf(` %s="%s"`, k, v)
	}

	return fmt.Sprintf("<%s%s>%s</%s>", tag.Name, attrs, tag.Text, tag.Name)
}

func (p *Parser) send(tag Tag) {
	var children TagChildren

	// replace npc links
	for i := range tag.Children {
		if i == 0 {
			continue
		}

		child := &tag.Children[i]
		lastChild := tag.Children[i-1]
		if child.Name == "a" && (lastChild.Name == "pushBold" || lastChild.Name == "b") {
			child.Attrs["class"] = "npc"
		}
	}

	// TODO: add toggle to disable link inlining
	// inline children so the slower UI doesn't have to do it
	var offset int
	for _, child := range tag.Children {
		if !p.isInline(child.Name) {
			children = append(children, child)
			continue
		}

		newText := tag.Text[:child.Start+offset] + p.expandInlineChild(child) + tag.Text[child.End+offset:]
		offset += len(newText) - len(tag.Text)
		tag.Text = newText
	}

	tag.Children = children
	p.ontag(tag)
}
