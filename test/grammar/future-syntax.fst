-- SYNTAX TEST "source.freest" "Syntax FreeST does not have yet"
-- Module headers, imports, qualified names and user-defined operators are
-- lexed but not parsed by FreeST 5, so this file does not compile.

module Data.Example where
-- <------ keyword.other.module.freest
--     ^^^^^^^^^^^^ entity.name.namespace.freest
--                  ^^^^^ keyword.other.where.freest

import Data.List
-- <------ keyword.other.import.freest
--     ^^^^^^^^^ entity.name.namespace.freest

h = Data.List.Elem
--  ^^^^^^^^^^ entity.name.namespace.freest
--            ^^^^ entity.name.type.freest

-- Each operator is one generic token; `=`, `:` and `|` only count on their own
k = a <+> b => c ==> d >>= e !! f |-| g ::: h .: i
--    ^^^ keyword.operator.freest
--          ^^ keyword.operator.freest
--          ^^ - keyword.operator.eq.freest
--               ^^^ - keyword.operator.eq.freest
--                     ^^^ keyword.operator.freest
--                           ^^ keyword.operator.freest
--                           ^^ - keyword.operator.bang.freest
--                                ^^^ - keyword.operator.pipe.freest
--                                      ^^^ - keyword.operator.colon.freest
--                                            ^^ - keyword.operator.dot.freest

-- An operator signature declares its name; infix equations are left to semantic tokens
(<+>) : Int -> Int -> Int
-- <----- entity.name.function.freest
x <+> y = x
-- <- - entity.name.function.freest
--^^^ - entity.name.function.freest
x@(Just y) <+> z = z
-- <- - entity.name.function.freest
