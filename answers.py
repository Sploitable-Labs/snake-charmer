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

#ExtractKeys
def foo(x):
    return [key for key, val in x.items()]

#Bin2Dec
def foo(x):
    return int(x, 2)

#Dec2Bin
def foo(x):
    return bin(x)[2:]

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

#ReverseString
def foo(input_string):
    return input_string[::-1]

#InvertDict
def foo(dictionary):
    return {value: key for key, value in dictionary.items()}