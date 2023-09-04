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
! Current state: calculator with + and - fully implemented

! comments starting with a dot mark a pendent loop (as in, the number of instructions to jump is still missing)
! Important constants to know:
  ! 10: nl
  ! 32: ' '
  ! 43: '+'
  ! 45: '-'
  ! 48: '0'

> ! scratch cell
  ,       ! start
  -10 [24 ! jump to nl
  -22 [23 ! jump to space
  -11 [22 ! jump to +
  -2  [21 ! jump to -
  -3      ! digit
    < [5 - > +10 < ]5
    > [5 - < + > ]5
    , ]24 ! jump to start
    [7    ! jump to nl
    [3    ! jump to space
    [6    ! jump to +
    [15   ! jump to -
          ! space
    >
    , ]7  ! jump to start
    [10   ! jump to nl
          ! +
    <2 [5 - < + > ]5
    , ]10 ! jump to start
    [10   ! jump to nl
          ! -
    <2 [5 - < - > ]5
    , ]10 ! jump to start
          ! nl
.
! Data delimiter
0 "Basic calculator" 
10 "Operators are: +, -"
10 "Operator order is post fix (5 3 + = 8)"
10