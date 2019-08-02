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
	Attrs TagAttributes `json:"attrs"`
	Start int           `json:"start"`
	End   int           `json:"end"`
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

type TagChildren []TagChild

func (t *TagChildren) Push(tag TagChild) {
	*t = append(*t, tag)
}

func (t *TagChildren) Peek() *TagChild {
	l := len(*t)

	if l == 0 {
		return nil
	}

	s := *t
	return &s[l-1]
}

func (t *TagChildren) Pop() TagChild {
	s := *t
	x, s := s[len(*t)-1], s[:len(*t)-1]
	*t = s
	return x
}
