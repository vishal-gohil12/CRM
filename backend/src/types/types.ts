export type User = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
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
    company_and_name: string;
    email: string;
    gst_no: number;
    phone?: string;
    remark?: string;
    companyName: string;
}