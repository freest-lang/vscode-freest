-- SYNTAX TEST "source.freest" "Comments"

x : Int
x = 1 -- A line comment with a TODO marker
--    ^^ comment.line.double-dash.freest punctuation.definition.comment.freest
--       ^^^^^^ comment.line.double-dash.freest
--                             ^^^^ keyword.other.todo.freest

y : Int
y = {- A block comment {- nested -} still inside -} 2
--  ^^ comment.block.freest punctuation.definition.comment.begin.freest
--                        ^^^^^^ comment.block.freest comment.block.freest
--                                  ^^^^^^^^^^^^ comment.block.freest
--                                                  ^ - comment.block.freest

z : Int
z = {--} 3
--  ^^^^ comment.block.freest
--       ^ - comment.block.freest

-- Unlike Haskell, `--` starts a comment even after operator characters
data T = A |-- comment
--         ^ keyword.operator.freest
--          ^^^^^^^^^^ comment.line.double-dash.freest
  B
w : Int
w = 4 --> comment
--    ^^^^^^^^^^^ comment.line.double-dash.freest
