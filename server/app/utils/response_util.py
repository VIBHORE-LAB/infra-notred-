from datetime import datetime

def generate_response(signautre,action,status,data=None,error=None):
    response = {
        "signature": signautre,
        "action": action,
        "status": status,
        "metadata":{
                "timestamp":datetime.utcnow().isoformat() + "Z",
                "version":"1.0",
                "env":"dev"
        },

        "data":data if data else {}
    }

    if error:
        if error:
         response["error"] = error
        return response
    
    