## Conditionals

# OddEven
def foo(x):
    return 'Even' if x % 2 == 0 else 'Odd'

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

## Conversions

#Bin2Dec
def foo(x):
    return int(x, 2)

#Dec2Bin
def foo(x):
    return bin(x)[2:]

## Dictionaries

#ExtractKeys
def foo(x):
    return [key for key, val in x.items()]

#SumDict
def foo(dictionary):
    return sum(value for value in dictionary.values() if isinstance(value, (int, float)))

#Dict2TupleList
def foo(dictionary):
    return list(dictionary.items())

#MergeDicts
def foo(dict1, dict2):
    merged_dict = dict1.copy()
    merged_dict.update(dict2)
    return merged_dict

#TupleList2Dict
def foo(tuple_list):
    return {key: value for key, value in tuple_list}

#CountCharacters
def foo(input_string):
    char_count = {}
    for char in input_string:
        char_count[char] = char_count.get(char, 0) + 1
    return char_count

#InvertDict
def foo(dictionary):
    return {value: key for key, value in dictionary.items()}

## Lists

#MinNumber
def foo(numbers):
    if not numbers:  # Check if the list is empty
        return None
    return min(numbers)

#CountOccurenceInList
def foo(lst, target):
    return lst.count(target)

#RemoveListDups
def foo(lst):
    return list(set(lst))

## Loops

#SquareNumbers
def foo(numbers):
    return [x ** 2 for x in numbers]

#Factorial
def foo(n):
    if n < 0:
        return "Factorial is not defined for negative numbers"
    elif n == 0 or n == 1:
        return 1
    else:
        result = 1
        for i in range(2, n + 1):
            result *= i
        return result

#Factors
def foo(n):
    if n <= 0:
        return "Input must be a positive integer"
    return [i for i in range(1, n + 1) if n % i == 0]

#PrimeChecker
def foo(n):
    if n <= 1:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

#FibonacciSequence
def foo(n):
    if n <= 0:
        return "Input must be a positive integer"
    fibonacci_sequence = [0, 1]
    for _ in range(2, n):
        fibonacci_sequence.append(fibonacci_sequence[-1] + fibonacci_sequence[-2])
    return fibonacci_sequence[:n]

## Maths

#Sum
def foo(a, b):
    return a+b

#AbsoluteDifference
def foo(a, b):
    return abs(a - b)

#SquareRootApproximation
def foo(n):
    if n < 0:
        return "Input must be a non-negative number"
    guess = n / 2
    while abs(guess ** 2 - n) > 0.0001:
        guess = (guess + n / guess) / 2
    return round(guess, 4)

#GCD
def foo(a, b):
    while b:
        a, b = b, a % b
    return a

#PerfectNumberChecker
def foo(n):
    if n <= 0:
        return False
    divisors = [i for i in range(1, n) if n % i == 0]
    return sum(divisors) == n

#ArmstrongNumberChecker
def foo(n):
    if n <= 0:
        return False
    num_str = str(n)
    num_digits = len(num_str)
    return sum(int(digit) ** num_digits for digit in num_str) == n

## Strings

#ReverseString
def foo(input_string):
    return input_string[::-1]

#CountVowels
def foo(input_string):
    vowels = "aeiouAEIOU"
    return sum(1 for char in input_string if char in vowels)

#PalindromeChecker
def foo(input_string):
    cleaned_string = input_string.replace(" ", "").lower()  # Remove spaces and make lowercase
    return cleaned_string == cleaned_string[::-1]

#CheckSubstring
def foo(string1, string2):
    return string2 in string1

#AnagramChecker
def foo(s1, s2):
    return sorted(s1) == sorted(s2)

## Tuples

#TuplePacking
def foo(*args):
    return args

#TupleMax
def foo(numbers):
    return max(numbers)

#MaxTupleSum
def foo(tuples_list):
    return max(tuples_list, key=lambda x: sum(x))