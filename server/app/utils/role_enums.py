from enum import Enum

class UserRole(Enum):
    OWNER = "Owner"
    ADMIN = "Admin"
    USER = "User"
    
    
    @staticmethod
    def list():
        return list(map(lambda c: c.value, UserRole))