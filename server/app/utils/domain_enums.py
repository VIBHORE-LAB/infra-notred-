from enum import Enum

class CompanyDomain(Enum):
    TRANSPORT = "Transportation Infrastructure"
    URBAN = "Urban Infrastructure & Buildings"
    ENERGY = "Utilities & Energy Infrastructure"
    INDUSTRIAL = "Industrial Infrastructure"
    SUSTAINABLE = "Environmental & Sustainable Infrastructure"
    OTHER = "Other"

    @staticmethod
    def list():
        return list(map(lambda d: d.value, CompanyDomain))
