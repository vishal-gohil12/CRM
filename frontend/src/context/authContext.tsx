import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
    email?: string;
    role: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;
}

interface MyJwtPayload {
    email: string;
    role: string;
    exp: number;  
    iat: number;  
  }

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUserState] = useState<User | null>(null);
    const setUser = (user: User) => {
        setUserState(user);
    }

    const clearUser = () =>{
        setUserState(null);
        localStorage.removeItem("token");
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if(token) {
            try {
                const decode = jwtDecode<MyJwtPayload>(token);
                if(Date.now() / 1000  > decode.exp) {
                    console.warn("Token is expired");
                    localStorage.removeItem("token");
                    setTimeout(() => clearUser(), 0);
                } else {
                    setUser({ email: decode.email, role: decode.role});
                }
            } catch(error: unknown) {
                console.error("Invalid token", error);
                localStorage.removeItem("token");
                setTimeout(() => clearUser(), 0);
            }
        } 
    }, []);


    return (
        <UserContext.Provider value={{ user, setUser, clearUser}}>
            {children}
        </UserContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}