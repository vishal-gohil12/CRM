export type User = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
    role: Role
}

export type Company = {
    name: string;
    industry: string;
    email?: string;
}

export enum Role {
    admin = "admin",
   user = "user"
}

export type Customer = {
    id?:string;
    company_and_name: string;
    email: string;
    gst_no: string;
    phone?: string;
    remark?: string;
    companyName: string;
}