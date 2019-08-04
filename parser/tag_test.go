package parser

import (
	"testing"

	"github.com/stretchr/testify/suite"
)

type TagSuite struct {
	suite.Suite
}

func TestTag(t *testing.T) {
	suite.Run(t, new(TagSuite))
}

func (s *TagSuite) TestPush() {
	var t Tags

	t1 := Tag{Name: "Tag1"}
	t2 := Tag{Name: "Tag2"}

	t.Push(t1)
	t.Push(t2)

	if !s.Len(t, 2) {
		return
	}

	s.Equal(t1, t[0])
	s.Equal(t2, t[1])
}

func (s *TagSuite) TestPeek() {
	var t Tags

	if !s.Nil(t.Peek()) {
		return
	}

	t1 := Tag{Name: "Tag1"}
	t.Push(t1)

	s.Equal(&t1, t.Peek())
}

func (s *TagSuite) TestPop() {
	var t Tags
	t1 := Tag{Name: "Tag1"}
	t2 := Tag{Name: "Tag2"}

	t.Push(t1)
	t.Push(t2)

	s.Equal(t2, t.Pop())
	s.Len(t, 1)
}

func (s *TagSuite) TestPushingChildren() {
	var t Tags

	if !s.Nil(t.Peek()) {
		return
	}

	t1 := Tag{Name: "Tag1"}
	t.Push(t1)

	s.Equal(&t1, t.Peek())

	t.Peek().AddChild(Tag{
		Name: "child1",
		Text: "foobar",
	})
	if !s.Len(t.Peek().Children, 1) {
		return
	}

	t.Peek().AddChild(Tag{
		Name: "child2",
		Text: "foobar",
	})
	if !s.Len(t.Peek().Children, 2) {
		return
	}
}
