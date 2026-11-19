-- SYNTAX TEST "source.freest" "Literals"

n : Int
n = 1_000 + 2
--  ^^^^^ constant.numeric.integer.decimal.freest

r : Float
r = 2.5e-3 +. 3e10
--  ^^^^^^ constant.numeric.float.freest
--            ^^^^ constant.numeric.float.freest

-- Haskell escapes, as decoded by `read`
s : String
s = "tab\t \65 \x41 \NUL \&"
--  ^ string.quoted.double.freest punctuation.definition.string.begin.freest
--      ^^ constant.character.escape.freest
--         ^^^ constant.character.escape.freest
--             ^^^^ constant.character.escape.freest
--                  ^^^^ constant.character.escape.freest
--                       ^^ constant.character.escape.freest

-- The lexer accepts `\n` as the only escape in a character literal
c : [Char]
c = ['a', '\n']
--   ^^^ string.quoted.single.freest
--         ^^ constant.character.escape.freest

-- Primes in identifiers do not start character literals
f' : Int -> Char
f' x' = 'b'
-- <-- - string.quoted.single.freest
-- ^^ - string.quoted.single.freest
--      ^^^ string.quoted.single.freest

-- Multi-line strings, as in GHC: `"` and `""` need no escape
ml : String
ml =
  """
--^^^ string.quoted.triple.freest punctuation.definition.string.begin.freest
  say "hi", "" and \""" here
--^^^^^^^^^^^^^^^^^^^^^^^^^^ string.quoted.triple.freest
--                 ^^ constant.character.escape.freest
  \&  a\nb\t\65
--^^ constant.character.escape.freest
--     ^^ constant.character.escape.freest
--        ^^ constant.character.escape.freest
--          ^^^ constant.character.escape.freest
  -- not a comment
--^^^^^^^^^^^^^^^^ string.quoted.triple.freest - comment
  """
--^^^ string.quoted.triple.freest punctuation.definition.string.end.freest

-- A gap may close a multi-line string's last line
gapEnd : String
gapEnd =
  """
  Line 2\
--      ^ constant.character.escape.gap.begin.freest
  \"""
--^ constant.character.escape.gap.end.freest
-- ^^^ punctuation.definition.string.end.freest

-- The first `"""` closes the string
quotes : String
quotes = """a""""b"
--       ^^^ punctuation.definition.string.begin.freest
--           ^^^ punctuation.definition.string.end.freest
--              ^ string.quoted.double.freest punctuation.definition.string.begin.freest - string.quoted.triple

empty : String
empty = """"""
--      ^^^^^^ string.quoted.triple.freest
--         ^^^ punctuation.definition.string.end.freest

-- Gaps in ordinary strings
gap : String
gap = "ab\    \cd"
--       ^ constant.character.escape.gap.begin.freest
--            ^ constant.character.escape.gap.end.freest
--             ^^^ string.quoted.double.freest
--               ^ punctuation.definition.string.end.freest

-- A gap may span lines in an ordinary string
longGap : String
longGap = "ab\
--           ^ constant.character.escape.gap.begin.freest
  \cd"
--^ constant.character.escape.gap.end.freest
-- ^^ string.quoted.double.freest
--   ^ punctuation.definition.string.end.freest
