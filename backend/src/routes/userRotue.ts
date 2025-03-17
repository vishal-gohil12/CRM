import { Router } from "express";
import { Role, User } from "../types/types";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();
export const userRoute = Router();

interface UserLogin {
    email: string;
    password: string;
    companyName: string;
}

const secret = process.env.JWT_SECRET ?? (() => { throw new Error("Secret is missing") })();

userRoute.post('/user/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password }: User = req.body;

        const adminExists = await prisma.user.findFirst();
        if (adminExists) {
            res.status(400).json({
                status: false,
                message: "Admin already exists. Only one admin is allowed."
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
                role: Role.admin,
            }
        });

        res.status(201).json({
            status: true,
            message: "Admin user created successfully."
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});


userRoute.post('/user/login', async (req, res) => {
    try {
        const { email, password, companyName }: UserLogin = req.body;

        const company = await prisma.company.findUnique({ where: { name: companyName } });
        if (!company) {
            res.status(404).json({ status: false, error: "Company not found." });
            return;
        }

        const user = await prisma.user.findFirst({ where: { email } });
        if (!user) {
            res.status(404).json({ status: false, error: "Admin not found." });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ status: false, error: "Invalid credentials." });
            return;
        }

        const token = jwt.sign(
            { email: user.email, role: user.role, companyId: company.id },
            secret,
            { expiresIn: "1h" }
        );

        res.json({
            status: true,
            role: user.role,
            message: "Login successful.",
            token: token
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});
