-- SYNTAX TEST "source.freest" "Types and kinds"

type Stream : 1S
type Stream = !Int ; Close

-- All types share entity.name.type, so that every theme colors them alike
f : Int -> Dual Stream -> Maybe Bool
--  ^^^ entity.name.type.builtin.freest
--         ^^^^ entity.name.type.builtin.freest
--              ^^^^^^ entity.name.type.freest
--                        ^^^^^ entity.name.type.freest
f n c = let (m, c) = receive c in wait c ; Just (m == n)

-- Constructors and labels are not told apart from types
g : Maybe Bool
g = Just True
--  ^^^^ entity.name.type.freest
--       ^^^^ entity.name.type.freest

-- A kind is a multiplicity followed by a prekind; multiplicity variables stay plain
type K : *T -> 1S -> 1S
--       ^ entity.name.type.multiplicity.freest
--        ^ entity.name.type.prekind.freest
--             ^ entity.name.type.multiplicity.freest
--              ^ entity.name.type.prekind.freest
type K a s = !a ; s

h : forall #m (a : m T) (b : *T) -> a -m-> Void @*T -m-> a
--                 ^ - entity.name.type.freest
--                   ^ entity.name.type.prekind.freest
--                                               ^ entity.name.type.multiplicity.freest
--                                                ^ entity.name.type.prekind.freest
h x _ = x

-- A type after a colon is not a kind
data T = A
k : T -> T
k = \(x : T) -> (x : T)
--                   ^ entity.name.type.freest
--                   ^ - entity.name.type.prekind.freest

-- Known limit: `f T` after a colon is read as a kind even when it is a type
l : forall (f : *T -> *T) -> f T -> f T
l @f z = (z : f T)
--              ^ entity.name.type.prekind.freest
