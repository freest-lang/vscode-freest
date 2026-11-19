-- SYNTAX TEST "source.freest" "Operators"

-- Syntax symbols
data T = A | B
--     ^ keyword.operator.eq.freest
--         ^ keyword.operator.pipe.freest

f : Int -> Int
f = \x -> (x : Int)
--  ^ keyword.operator.lambda.freest
--     ^^ keyword.operator.arrow.freest
--           ^ keyword.operator.colon.freest

g : () -> ()
g u = u ; u
--      ^ keyword.operator.semicolon.freest

h : Int -> Int
h = negate . negate
--         ^ keyword.operator.dot.freest

-- Type and multiplicity abstraction: `\` followed by `@` or `#`
p : forall (a : *T) -> a -> a
p = \@a (x : a) -> x
--  ^ keyword.operator.lambda.freest
--   ^ keyword.operator.at.freest

q : forall #m -> Int -m-> Int
q = \#m -> \(x : Int) -m-> x
--  ^ keyword.operator.lambda.freest
--   ^ keyword.operator.hash.freest

-- As-pattern
r : Maybe Int -> Int
r x@(Just y) = y
-- ^ keyword.operator.at.freest
r Nothing = 0

-- Other operators are generic, including `+` and `*` outside session types
k : Int
k = 1 + 2 * 3 |> negate
--    ^ keyword.operator.freest
--    ^ - keyword.operator.plus.freest
--        ^ keyword.operator.freest
--        ^ - keyword.operator.star.freest
--            ^^ keyword.operator.freest

l : [Int]
l = 1 :: [2] ++ [3]
--    ^^ keyword.operator.freest
--    ^^ - keyword.operator.colon.freest
--           ^^ keyword.operator.freest

m : [Int]' -> [Int]' -1-> [Int]'
m xs ys = 0 ::' (xs ++' ys)
--          ^^^ keyword.operator.freest
--                  ^^^ keyword.operator.freest

b : Bool
b = 1 <= 2 && 1.0 >=. 2.0 || 1 /= 2
--    ^^ keyword.operator.freest
--    ^^ - keyword.operator.eq.freest
--                ^^^ keyword.operator.freest
--                             ^^ keyword.operator.freest
--                             ^^ - keyword.operator.eq.freest
