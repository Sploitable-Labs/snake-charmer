def FizzBuzz(n):
    ans = []
    for num in range(1,n+1):
        if num % 5 == 0 and num % 3 == 0:
            ans.append("FizzBuzz")
        elif num % 3 == 0:
            ans.append("Fizz")
        elif num % 5 == 0:
            ans.append("Buzz")
        else:
            ans.append(num)
    return ans

#print(FizzBuzz(20))



def abs_test(a,b):
    return abs(a-b)

print(abs_test(-1, 4))