export type User = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: Role;
    companyName: string;
}

export type Company = {
    name: string;
    industry: string;
}

export enum Role {
    admin = "admin",
    employee = "employee"
}

export type Customer = {
    id?:string;
    name: string;
    email: string;
    phone?: string;
    remark?: string;
    companyName: string;
}