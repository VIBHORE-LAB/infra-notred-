from datetime import datetime
from bson import ObjectId

VALID_SENTIMENT_TAGS = ["Great", "Needed", "Delayed", "Wasteful", "Excellent", "Poor"]


def create_rating_schema(project_id, user_id, stars, sentiment_tag=None):
    if not (1 <= stars <= 5):
        raise ValueError("Stars must be between 1 and 5")
    if sentiment_tag and sentiment_tag not in VALID_SENTIMENT_TAGS:
        raise ValueError(f"Invalid sentiment tag. Valid: {VALID_SENTIMENT_TAGS}")
    return {
        "projectId": ObjectId(project_id),
        "userId": str(user_id),        # anonymous string ID from public user
        "stars": int(stars),
        "sentimentTag": sentiment_tag,
        "createdAt": datetime.utcnow(),
    }
