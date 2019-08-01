package parser

type TagAttributes map[string]string

type Tag struct {
	Name     string        `json:"name"`
	Text     string        `json:"text"`
	Attrs    TagAttributes `json:"attrs"`
	Children TagChildren   `json:"children"`
}

func (t *Tag) AddChild(child Tag) {
	c := TagChild{
		Name:  child.Name,
		Attrs: child.Attrs,
		Text:  child.Text,
		Start: len(t.Text),
	}

	t.Text += child.Text
	c.End = len(t.Text)
	t.Children.Push(c)
}

type TagChild struct {
	Name  string        `json:"name"`
	Text  string        `json:"text"`
	Attrs TagAttributes `json:"attributes"`
	Start int           `json:"start"`
	End   int           `json:"end"`
}
