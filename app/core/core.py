import requests
import asyncio
from core.secure import SecureStorage
data = SecureStorage()
from colorama import Fore

def make_request(credentials=False,password=None,username=None, token=None):
    if(credentials != False):
        req = requests.post('http://localhost:5000/api/login', json={f'password':password, 'username':username})
        return req
    else:
        req =  requests.post('http://localhost:5000/api/login', json={f'token':token})
        return req
def check_token(json):
    if(json['success'] == True):
        return True
    else:
        return False


async def logins(password= None, username= None, token= None):
    tryes = 3
    if(token != None):
         req = make_request(token=token)
         if(check_token(req.json()) == True):
            tryes = 0
            print("Login Successful")
         else:
            while check_token(req.json()) == False and tryes != 0 :
                inmp = input(Fore.RESET + Fore.RED + f"Your Token is invalid {tryes} tryes left >>> ")
                req = make_request(inmp)
                tryes -= 1
                if(check_token(req.json()) == True):
                    print(Fore.RESET + Fore.GREEN + "Login Successful")
                    break
                if(tryes == 0):
                    print(Fore.RESET + Fore.RED + "Login Failed")
                    break
    if(password and username  != None):
        req = make_request(credentials=True, password=password,username=password)
        if(check_token(req.json()) == True):
            tryes = 0
            print("Login Successful")
        while check_token(req.json()) == False and tryes != 0:
            
                print(Fore.RESET + Fore.RED + f"Your Password or Username is invalid, {tryes} tryes left >>> ")
                inmp_username = input("Username >>>")
                inmp_password = input("Password >>>")
                req = make_request(credentials=True, password=inmp_password,username=inmp_username)
                tryes -= 1
                if(check_token(req.json()) == True):
                    print(Fore.RESET + Fore.GREEN + "Login Successful")
                    break
                if(tryes == 0):
                    print(Fore.RESET + Fore.RED + "Login Failed")
                    break

            