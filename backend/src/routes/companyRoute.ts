import { Router } from "express";
import { Company } from "../types/types";
import { authUser } from "../middleware/auth";
import { prisma } from "..";

export const companyRotue = Router();

companyRotue.post('/add', authUser, async (req, res) => {
    try {
        const { name, industry } : Company = req.body;
        const company = await prisma.company.create({
            data: {
                name: name,
                industry: industry
            }
        });

        res.status(201).json({
            status: true,
            company: company
        });
    } catch(error: any) {
        res.status(500).json({
            error: error.message
        });
    }
});