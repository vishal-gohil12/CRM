import { Router } from "express";
import { Role, User } from "../types/types";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();
export const userRoute = Router();

const secret = process.env.JWT_SECRET ?? (() => { throw new Error("Secret is missing") })();

userRoute.post('/users/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, companyName  }: User = req.body;

        const company = await prisma.company.findUnique({ where: { name: companyName }});
        if(!company) {
            res.status(404).json({
                error: "Company not found"
            });
            return;
        }
        
        const isEmailExist = await prisma.user.findUnique({ where: {
            email: email
        }});

        if(isEmailExist) {
            res.json({
                status: false,
                message: "Email is exist try different email address"
            });
            return;
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashPassword,
                role: role ?? Role.employee,
                companyId: company.id
            }
        });

        res.status(201).json({
            status: true,
            message: "User is created."
        });
    } catch(error) {
        res.status(500).json({ 
            status: false,
            message: "Internal Server Error"
        });
    }
});

userRoute.post('/users/login', async (req, res)=>{ 
    try {
        const { email, password, companyName } = req.body;
        const company = await prisma.company.findUnique({ where: { name: companyName }});
        if(!company) {
            res.status(404).json({
                error: "Company not found"
            });
            return;
        }

        const user = await prisma.user.findFirst({
            where: { email, companyId: company.id },
        });

        if(!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            res.status(400).json({
                status: false,
                error: "Invalid credentials"
            });
            return;
        }
        const token =  jwt.sign({
            email: user.email,
            role: user.role
        }, secret, {
            expiresIn: '1h'
        });

        res.json({ 
            status: true,
            user: user.role,
            message: "login",
            token: token
        });
    } catch(error) {
        res.status(500).json({ 
            status: false,
            message: "Internal Server Error"
        });
    }
});