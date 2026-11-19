{- |
Showcase of FreeST syntax, used to review syntax highlighting.
Block comments {- like this one -} nest.
-}

-- * Types and kinds
-- TODO: a line comment with a marker

type Counter : 1S
type Counter = +{Inc: Counter, Get: ?Int ; Close}

type Pair : *T -> *T -> *T
type Pair a b = (a, b)

data Shape = Circle Float | Rect Float Float

type Stream : 1C
type Stream = &{Next: ?Int ; Stream, Stop: Wait}

type Shared : *C
type Shared = *!Int

type Signal : *C
type Signal = *+{Ping, Stop}

type Fold : 1S
type Fold = ?type (a : *T) . ?a ; Close

type Pack : *T
type Pack = (exists a, (a, a -> Int))

-- * Functions, multiplicities and arrows

apply : forall #m (a : m T) (b : 1T) -> (a -m-> b) -> a -m-> b
apply f x = f x

twice : forall (a : *T) -> (a -> a) -> a -1-> a
twice @a f x = f (f x)

compose', flip'' : forall #m #n (a : 1T) (b : 1T) (c : 1T) -> (b -m-> c) -> (a -n-> b) -m-> a -m+n-> c
compose' f g x = f (g x)
flip'' f g x = f (g x)

linear : [Int]' -> [Int]' -1-> [Int]'
linear xs ys = 0 ::' (xs ++' ys)

plus : Int -> Int -> Int
plus = (+)

-- * Literals and operators

numbers : Int
numbers = 1_000 + 2 - 3 * 4 / 5 ^ 2 + plus 7 8

floats : Float
floats = 1.5 +. 2.0e-3 -. 3e10 *. 4.0 /. 0.5 ** 2.0

comparisons : Bool
comparisons = 1 < 2 && 1 <= 2 && 1 == 2 || 1 /= 2 && 1.0 <. 2.0 && not (1 >= 2)

chars : [Char]
chars = ['a', '\n', ' ']

strings : String
strings = "tab:\t quote:\" backslash:\\ code:\65 hex:\x41" ++ show (length [1, 2])

poem : String
poem =
  """
  Say "hello" and ""goodbye"",
    \&  keep this indent, \
  \and close the gap.
  """

-- * Data, patterns and control flow

area : Shape -> Float
area s =
  case s of
    Circle r -> 3.14 *. r *. r
    Rect w h -> if w >. 0.0 then w *. h else 0.0

firstOr : Int -> [Int] -> Int
firstOr d []          = d
firstOr _ all@(x::_)  = x

describe : Char -> String
describe 'a' = "letter a"
describe _   = "something else"

-- * Sessions

counterServer : Int -> Dual Counter -> ()
counterServer n (&Inc c) = counterServer (n + 1) c
counterServer n (&Get c) = c |> send n |> wait

client : Counter -> Int
client c =
  let (n, c') = c |> select Inc |> select Get |> receive in
  close c' ; n

producer : Int -> Dual Stream -> ()
producer 0 c = c |> select Stop |> close
producer n c = c |> select Next |> send n |> producer (n - 1)

consumer : Stream -> Int
consumer (&Next (?x ; c)) = x + consumer c
consumer (&Stop c)        = wait c ; 0

notify : Signal -> Shared -> ()
notify s t = select_ Ping s ; send_ 5 t ; ()

foldClient : Dual Fold -> ()
foldClient c = c |> sendType @Int |> send 5 |> wait

pack : Pack
pack = (@Int, (5, \(x : Int) -> x + 1))

main : Int
main =
  let (r, w) = channel @Stream in
  fork (\_ -1-> producer 3 w) ;
  let total = consumer r in
  print total ;
  apply #1 (\(x : Int) -1-> x) $ twice @Int (\x -> x * 2) total
  where
    helper : Int -> Int
    helper x = x

mutual
  even' : Int -> Bool
  even' n = if n == 0 then True else odd' (n - 1)

  odd' : Int -> Bool
  odd' n = if n == 0 then False else even' (n - 1)
