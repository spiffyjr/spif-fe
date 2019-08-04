package parser

type TagAttributes map[string]string

type Tag struct {
	Name     string        `json:"name"`
	Text     string        `json:"text"`
	Attrs    TagAttributes `json:"attrs"`
	Start    int           `json:"start"`
	End      int           `json:"end"`
	Children Tags          `json:"children"`
}

func (t *Tag) AddChild(child Tag) {
	child.Start = len(t.Text)
	t.Text += child.Text
	child.End = len(t.Text)
	t.Children.Push(child)
}

type Tags []Tag

func (t *Tags) Push(tag Tag) {
	*t = append(*t, tag)
}

func (t *Tags) Peek() *Tag {
	l := len(*t)

	if l == 0 {
		return nil
	}

	s := *t
	return &s[l-1]
}

func (t *Tags) Pop() Tag {
	s := *t
	x, s := s[len(*t)-1], s[:len(*t)-1]
	*t = s
	return x
}
