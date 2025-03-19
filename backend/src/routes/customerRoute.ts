import { Router } from "express";
import { authUser } from "../middleware/auth";
import { Customer } from "../types/types";
import { prisma } from "..";
import { Prisma } from "@prisma/client";

export const customerRoute = Router();

customerRoute.post('/add_customer', authUser, async (req, res) => {
    try {
        const { company_and_name, email, gst_no, phone, remark, companyName }: Customer = req.body;

        const company = await prisma.company.findUnique({ where: { name: companyName }});
        if(!company) {
            res.status(404).json({
                status: false,
                error: "Company not found"
            });
            return;
        }

        const existingCustomer = await prisma.customer.findUnique({ where: { email } });
        if (existingCustomer) {
            res.status(400).json({
                status: false,
                error: "A customer with this email already exists"
            });
            return;
        }

        if(!company_and_name || !email ) {
            res.status(404).json({
                status: false,
                error: "Fill the all data"
            });
            return;
        }

        const customer = await prisma.customer.create({
            data: { 
                company_and_name, 
                email, 
                phone, 
                gst_no,
                remark, 
                company: {
                    connect: {id: company.id}
                }
            },
            include: {
                company: true
            }
        });

        res.status(201).json({
            status: true,
            message: "Customer is created",
            customer: customer
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({ 
            status: false,
            message: "Internal Server Error"
        });
    }
});

customerRoute.get('/get_all', authUser, async (req, res)=> {
    try {  
        const companyName = req.query.companyName as string;      
        const customer = await prisma.customer.findMany({
            where: {
                company: {
                    name: companyName
                }
            },
            include: {
                company: {
                    select: { name: true }
                }
            }
        });

        const customers = customer.map(cust => ({
            id: cust.id,
            company_and_name: cust.company_and_name,
            email: cust.email,
            companyName: cust.company.name,
            gst_no: cust.gst_no,
            phone: cust.phone,
            remark: cust.remark
        }))

        res.json({
            status: true,
            customers: customers,
        });
    } catch (e) {
        res.status(500).json({ 
            status: false,
            message: "Internal Server Error"
        });
    }
});

customerRoute.put("/update", async (req, res) => {
    try {
        const { id, company_and_name, email, phone, gst_no, remark, companyName } : Customer = req.body;
        let updateData : Prisma.CustomerUpdateInput = { company_and_name, email, phone, remark, gst_no };
        if(companyName) {
            const company = await prisma.company.findUnique({
                where: { name: companyName }
            });
            if(!company) {
                res.status(404).json({
                    status: false,
                    message: "Company not found",
                });
                return;
            }

            updateData.company = { connect: { id: company?.id }};
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({
            status: true,
            message: "Customer updated successfully",
            customer: updatedCustomer,
        });
    } catch (e) {
        console.log("Error: ", e);
        res.status(500).json({ 
            status: false,
            message: "Internal Server Error"
        });
    }
});

customerRoute.delete("/delete", async (req, res) => {
    try {
        const { id } = req.body;
        const customer = await prisma.customer.findUnique({
            where: {id}
        });

        if(!customer) {
            res.status(404).json({
                status: false,
                message: "Customer not found",
            });
            return;
        }

        await prisma.customer.delete({
            where: { id }
        });

        res.status(200).json({
            status: true,
            message: "Customer deleted successfully",
        });
    } catch (e) {
        console.log("Error: ", e);
        res.status(500).json({ 
            status: false,
            message: "Internal Server Error"
        });
    }
});