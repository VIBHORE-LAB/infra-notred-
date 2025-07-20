from enum import Enum

class Milestones(Enum):
    PLANNED = "Planned"
    INPROGRESS = "In Progress"
    COMPLETED = "Completed"


    @staticmethod
    def list():
        return list(map(lambda c: c.value, Milestones))
