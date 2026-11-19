-- SYNTAX TEST "source.freest" "Declared names"

-- Names declared in column-0 signatures, including operators
f, g : Int
-- <- entity.name.function.freest
-- ^ entity.name.function.freest
f = 1
g = 2

(||) : Bool -> Bool -> Bool
-- <---- entity.name.function.freest
(||) x y = if x then True else y

-- Names in equations are left to semantic tokens
h : Int -> Int
h x = x
-- <- - entity.name.function.freest

-- Indented signatures too
mutual
  even' : Int -> Bool
--^^^^^ - entity.name.function.freest
  even' n = if n == 0 then True else odd' (n - 1)
  odd' : Int -> Bool
  odd' n = if n == 0 then False else even' (n - 1)
