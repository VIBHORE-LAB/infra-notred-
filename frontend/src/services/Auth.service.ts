import { createInstance } from "./config";


export class AuthService {
    static instance = createInstance("auth");
    static login(param: Dict) {
        return this.instance.post("/login", param);
    }

    static signup(param: Dict) {
        return this.instance.post("/signup", param);
    }
}