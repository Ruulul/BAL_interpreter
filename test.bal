! Startup procedure: go to last cell; loop: go left, if non empty, stop, else, go left
  <   ! last cell
  + < ! else flag; check next
  [4  ! if non null
    > - [6 ! clear else flag and exit
  > - < ! else
  + ]9 ! repeat

! print introduction
  < ] > .1 ]2 

! Calculator
! The plan: receive an expression
! Parse the expression putting numbers on a stack,
! and when hit an operator, perform it and place back on stack
! on the end of it, print the number
! (optional) repeat
! Current state: reading numbers in sequence

! comments starting with a dot mark a pendent loop (as in, the number of instructions to jump is still missing)
! Important constants to know:
  ! 10: nl
  ! 32: ' '
  ! 42: '*'
  ! 43: '+'
  ! 46: '-'
  ! 47: '/'
  ! 48: '0'

> ! scratch cell
  [26       ! go to entry point
  -22 [25   ! space
  -10 [27   ! *
  -1  [     ! . +
  -3  [     ! . -
  -1  [     ! . /
  -1        ! otherwise, assume it is a digit
  < [5 - > +10 < ]5 ! sum acc x10
  > [5 - < + > ]5   ! move total to acc
  [3        ! exit
      ! space handling
  >
    ]27 ! return to start
    [0  ! exit
    ]2  ! return to start
      ! * (A|B|0*)->(AxB|0*)
    <3
    ! mul loop; assumes A > 0 
      >
      [7 - > + > + <2 ]7 ! (A|0*|B|B)
      >2
      [5 - <2 + >2 ]5 ! (A|B|B|0*)
      <3 - 
    ]18
    > - ] 
    >
    - <2 + >2 ]4 < 
      ]31 ! return to start
      [   ! . exit point
      ]2  ! return to start
  ,         ! entry point
  -10 ]3  ! . jump back if not nl

. 
! Data delimiter
0 "Basic calculator" 
10 "Operators are: *, +, -, /"
10 "Operator order is post fix (5 3 + = 8)"
10