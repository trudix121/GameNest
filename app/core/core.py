import requests
import asyncio
from colorama import Fore
from core.secure import SecureStorage
import os 
data = SecureStorage()
def check_data(id):
    reqs = data.get_data(id)
    if(reqs != None):
        return reqs
    else:
        return  False

def make_request(credentials=False, password=None, username=None, token=None):
    """Make authentication request to the API"""
    base_url = 'http://localhost:5000/api/login'
    try:
        if credentials:
            response = requests.post(base_url, json={'password': password, 'username': username})
        else:
            response = requests.post(base_url, json={'token': token})
        return response
    except requests.RequestException as e:
        print(Fore.RED + f"Connection error: {e}")
        return None

def check_token(response):
    """Validate authentication response"""
    if not response:
        return False
    if isinstance(response, requests.Response):
        return response.status_code == 200
    return False






async def logins(password=None, username=None, token=None):
    """Handle login process with retry mechanism"""
    tries = 3
    
    if token:
        # Token-based authentication
        response = make_request(token=token)
        if check_token(response):
            print(Fore.GREEN + "Login Successful")
            data.store_data({'_id': response.json()['_id'], '_sessionid': response.json()['_sessionId']}, response.json()['_id'])
            return True
            
        while tries > 0:
            print(Fore.RED + f"Your Token is invalid. {tries} tries left")
            new_token = input(Fore.RESET + "Enter token >>> ")
            response = make_request(token=new_token)
            if check_token(response):
                print(Fore.GREEN + "Login Successful")
                data.store_data({'_id': response.json()['_id'], '_sessionid': response.json()['_sessionId']}, response.json()['_id'])
                return True
                
            tries -= 1
            
    elif password and username:
        # Credentials-based authentication
        response = make_request(credentials=True, password=password, username=username)
        if check_token(response):
            print(Fore.GREEN + f"Login Successful, data:{response.json()}")
            data.store_data({'_id': response.json()['_id'], '_sessionid': response.json()['_sessionId']}, response.json()['_id'])
            
        while tries > 0 and response.status_code != 200:
            print(Fore.RED + f"Your Password or Username is invalid. {tries} tries left")
            new_username = input(Fore.BLUE + "Username >>> ")
            new_password = input("Password >>> " + Fore.RESET)
            response = make_request(credentials=True, password=new_password, username=new_username)
            
            if check_token(response):
                print(Fore.GREEN + f"Login Successful, data:{response.json()}")
                return True
                
            tries -= 1
    
    return False
