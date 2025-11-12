def is_prime(num):
    if num < 2:
        return False
    for i in range(2, int(num**0.5) + 1):
        if num % i == 0:
            return False
    return True


def next_primes(n):
    primes = []
    count = 0
    num = n + 1
    while count < 10:
        if is_prime(num):
            primes.append(num)
            count += 1
        num += 1
    return primes


# Get the input integer from the user
input_num = int(input("Enter an integer: "))

# Get the next 10 prime numbers after the given integer
result = next_primes(input_num)

# Print the result
print(f"The next 10 prime numbers after {input_num} are:")
for prime in result:
    print(prime)
