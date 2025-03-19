import { Router } from "express";
import { Company } from "../types/types";
import { authUser } from "../middleware/auth";
import { prisma } from "..";

export const companyRoute = Router();

companyRoute.post('/add', async (req, res) => {
    try {
        const { name, industry }: Company = req.body;
        const company = await prisma.company.create({
            data: {
                name: name.toLocaleLowerCase(),
                industry: industry
            }
        });

        res.status(201).json({
            status: true,
            company: company
        });
    } catch (error: any) {
        res.status(500).json({
            error: error.message
        });
    }
});

companyRoute.get('/all', authUser, async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            include: {
                customers: {
                    include: { transactions: true }
                },
                transactions: true
            }
        });

        const formattedCompanies = companies.map(company => ({
            id: company.id,
            name: company.name,
            industry: company.industry,
            customers: company.customers,
            transactions: company.transactions
        }));

        res.status(200).json({
            status: true,
            companies: formattedCompanies
        });
    } catch (error: any) {
        res.status(500).json({
            error: error.message
        });
    }
});