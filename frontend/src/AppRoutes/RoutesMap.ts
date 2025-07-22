import { lazy } from "react";

import type { AppRoute } from "./types";

// const Home = lazy(() => import("@/pages/Home"));
const Register = lazy(() => import("@/pages/auth/Register"));




class RoutesMap{
    // static HOME: AppRoute = {
    //     title: "Home",
    //     path:"",
    //     subRoutes:{},
    //     Element: Home,
    //     kind: "private",
    // };

    static REGISTER: AppRoute = {
        title: "Register",
        path: "/register",
        subRoutes:{},
        Element: Register,
        kind: "private",
    };
}


export default RoutesMap;