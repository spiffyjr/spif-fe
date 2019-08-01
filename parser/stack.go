package parser

type Tags struct {
	top    *tagsNode
	length int
}

type tagsNode struct {
	value Tag
	prev  *tagsNode
}

func (s *Tags) Len() int {
	return s.length
}

func (s *Tags) Peek() *Tag {
	if s.length == 0 {
		return nil
	}
	return &s.top.value
}

func (s *Tags) Pop() Tag {
	if s.length == 0 {
		return Tag{}
	}

	n := s.top
	s.top = n.prev
	s.length--
	return n.value
}

func (s *Tags) Push(value Tag) {
	n := &tagsNode{value, s.top}
	s.top = n
	s.length++
}

type TagChildren struct {
	top    *tagChildrenNode
	length int
}

type tagChildrenNode struct {
	value TagChild
	prev  *tagChildrenNode
}

func (s *TagChildren) Len() int {
	return s.length
}

func (s *TagChildren) Peek() *TagChild {
	if s.length == 0 {
		return nil
	}
	return &s.top.value
}

func (s *TagChildren) Pop() TagChild {
	if s.length == 0 {
		return TagChild{}
	}

	n := s.top
	s.top = n.prev
	s.length--
	return n.value
}

func (s *TagChildren) Push(value TagChild) {
	n := &tagChildrenNode{value, s.top}
	s.top = n
	s.length++
}
