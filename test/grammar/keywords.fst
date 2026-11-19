-- SYNTAX TEST "source.freest" "Keywords"

x : Int
x = let y = if True then 1 else case 2 of n -> n in y
--  ^^^ keyword.control.let.freest
--          ^^ keyword.control.if.freest
--                  ^^^^ keyword.control.then.freest
--                         ^^^^ keyword.control.else.freest
--                              ^^^^ keyword.control.case.freest
--                                     ^^ keyword.control.of.freest
--                                               ^^ keyword.control.in.freest

type P : 1S
type P = !type (a : *T) . !a ; Close
--        ^^^^ keyword.other.type.freest

data D = D
-- <---- keyword.other.data.freest

c : () -> (+{L: Close}, &{L: Wait})
c _ = channel @(+{L: Close})
--    ^^^^^^^ keyword.other.channel.freest

z : +{L: Close} -> Close
z k = select L k
--    ^^^^^^ keyword.other.select.freest

u : *+{M} -> *+{M}
u k = select_ M k
--    ^^^^^^^ keyword.other.select-unrestricted.freest

v : P -> ()
v k = k |> sendType @Int |> send 5 |> close
--         ^^^^^^^^ keyword.other.send-type.freest

t : (?type (a : *T) . Skip) -> Skip
t k = let (@(a : *T), s) = receiveType k in s
--                         ^^^^^^^^^^^ keyword.other.receive-type.freest

e : forall (a : *T) -> (exists b, b) -> a -> a
--  ^^^^^^ keyword.other.forall.freest
--                      ^^^^^^ keyword.other.exists.freest
e _ x = x

mutual
-- <------ keyword.other.mutual.freest
  even' : Int -> Bool
  even' n = if n == 0 then True else odd' (n - 1)
  odd' : Int -> Bool
  odd' n = if n == 0 then False else even' (n - 1)

-- Identifiers may contain primes, so these are not keywords
w : Int -> Int -> Int -> Int
w select' in' of' = select' + in' + of'
--^^^^^^^ - keyword.other.select.freest
--        ^^^ - keyword.control.in.freest
--            ^^^ - keyword.control.of.freest
