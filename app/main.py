import requests
import random
from colorama import Fore, Back
from getpass import getpass
from core.core import logins
import os
import asyncio
from core.secure import SecureStorage
secure = SecureStorage()

async def login():
    os.system('clear')
    print("Welcome to GameNest Client! - Login")
    print("1. Login With Token")
    print("2. Login With Credentials")
    inmp = int(input(">>>"))
    if inmp == 1:
        token = input("Enter your token: ")
        await logins(token=token)
        while len(token) == 0:
            print("Token cannot be empty!")
            token = input("Enter your token: ")
            if(len(token) > 0): await logins(token=token)
            

    if(inmp == 2):
        username = input("Enter your Username:")
        password = getpass("Enter Your Password (Hidden Input):")
        await logins(username=username, password=password)
        





async def menu():
    print(Fore.GREEN + "Welcome to GameNest client!")
    print("Login or create an account")
    print("1. Login")
    print("2. Create Account")
    option = int(input('>>>'))
    if(option == 1):
        await login()
    if(option == 2):
        print(Fore.RED +" CURRENTLY IS AVAILABLE ONLY IN BROWSER , LINK: http://localhost:5000/auth/register ")






if __name__ == '__main__':
    asyncio.run(menu())
    