# FizzBuzz
def foo(n):
    ans = []
    for num in range(1,n+1):
        if num % 5 == 0 and num % 3 == 0:
            ans.append("FizzBuzz")
        elif num % 3 == 0:
            ans.append("Fizz")
        elif num % 5 == 0:
            ans.append("Buzz")
        else:
            ans.append(str(num))
    return ans

# OddEven
def foo(x):
    return 'Even' if x % 2 == 0 else 'Odd'

#ExtractKeys
def foo(x):
    return [key for key, val in x.items()]