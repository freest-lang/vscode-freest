-- SYNTAX TEST "source.freest" "Multiplicities"

-- Only the dashes are the arrow; the multiplicity is colored on its own
f : forall #m #n (a : *T) -> a -1-> a -*-> a -m-> a -m+n-> a
--                        ^ keyword.operator.arrow.freest
--                              ^ entity.name.type.multiplicity.freest
--                                      ^^ keyword.operator.arrow.freest
--                                     ^ entity.name.type.multiplicity.freest
--                                                   ^ - entity.name.type.freest
--                                                   ^ - keyword.operator.arrow.freest
--                                                    ^ keyword.operator.plus.freest
f x _ _ _ = x

-- `#` is to multiplicities what `@` is to types
g : forall #m (a : 1T) (b : (1 + m) C) -> a -m-> a
--         ^ keyword.operator.hash.freest
--          ^ - entity.name.type.freest
--                           ^ entity.name.type.multiplicity.freest
--                                  ^ entity.name.type.prekind.freest
g x = x

h : forall #m -> Int -m-> Int
h #m x = g #1 @Int (g #* @Int (g #m @Int x))
--^ keyword.operator.hash.freest
--          ^ entity.name.type.multiplicity.freest
--                     ^ entity.name.type.multiplicity.freest
-- ^ - entity.name.type.freest
--            ^ keyword.operator.at.freest
