! Calculator
! The plan: receive 2 numbers and the operation symbol
! Check if the operation is equal to a supported symbol and execute operation
! If all checks are made and no supported symbol is found, print error
! Needed functions:
  ! Read number
  ! Print number
  ! End program

! Startup procedure: go to last cell; loop: go left, if non empty, stop, else, go left
  <   ! last cell
  + < ! else flag; check next
  [4  ! if non null
    > - [6 ! clear else flag and exit
  > - < ! else
  + ]9 ! repeat
  < ] > .1 ]2 ! print introduction
. 
! Data delimiter
0 "Basic calculator" 
10 "Operators are: *, +, -, /"
10 "Type and enter each operand, and then the operation"
10