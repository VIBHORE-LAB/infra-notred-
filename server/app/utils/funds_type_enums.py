from enum import Enum

class FundType(Enum):
    CREDIT = "Credit"
    EXPENDITURE = "Expenditure"
    @staticmethod
    def list():
        return list(map(lambda d: d.value, FundType))
