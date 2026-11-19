-- SYNTAX TEST "source.freest" "Invalid literals"
-- These type-check, but running a program that uses them fails with an
-- internal compiler error (`Prelude.read: no parse`).

s : String
s = "bad\q"
--      ^^ invalid.illegal.escape.freest

c : Char
c = '\'
--   ^ invalid.illegal.escape.freest

-- Only whitespace may sit inside a gap
g : String
g = "a\ x"
--    ^ constant.character.escape.gap.begin.freest
--      ^ invalid.illegal.escape.freest
--       ^ punctuation.definition.string.end.freest

-- An ordinary string ends at a line break, as the lexer does
u : String
u = "never closed
--  ^^^^^^^^^^^^^ string.quoted.double.freest
v : Int
-- <- - string
