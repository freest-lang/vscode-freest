-- SYNTAX TEST "source.freest" "Session types"

type S = !Int ; ?Bool ; *!Int ; *?Bool ; Skip ; Close ; Wait
--       ^ keyword.operator.bang.freest
--            ^ keyword.operator.semicolon.freest
--              ^ keyword.operator.question.freest
--                      ^ keyword.operator.star.freest
--                       ^ keyword.operator.bang.freest
--                              ^ keyword.operator.star.freest
--                               ^ keyword.operator.question.freest
--                                       ^^^^ entity.name.type.builtin.freest
--                                              ^^^^^ entity.name.type.builtin.freest
--                                                      ^^^^ entity.name.type.builtin.freest

type C = +{Inc: Close, Get: ?Int ; Close} ; &{Ping: Skip} ; *+{L, M} ; *&{N}
--       ^ keyword.operator.plus.freest
--        ^ punctuation.bracket.curly.freest
--         ^^^ entity.name.type.freest
--                                          ^ keyword.operator.amp.freest
--                                                          ^ keyword.operator.star.freest
--                                                           ^ keyword.operator.plus.freest
--                                                                     ^ keyword.operator.star.freest
--                                                                      ^ keyword.operator.amp.freest

-- The `{` of a choice may open the next line
type D = +
--       ^ keyword.operator.plus.freest
  { A: Skip }

-- Choice patterns
f : &{Inc: +{Done: Close}} -> *&{Join} -1-> ()
f (&Inc c) (*&Join d) = c |> select Done |> close
-- ^ keyword.operator.amp.freest
--          ^ keyword.operator.star.freest
--           ^ keyword.operator.amp.freest

-- `@` may be followed directly by a session type
g : (*?Int, *!Int)
g = channel @*?Int
--          ^ keyword.operator.at.freest
--           ^ keyword.operator.star.freest
--            ^ keyword.operator.question.freest
