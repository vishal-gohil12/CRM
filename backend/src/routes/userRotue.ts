import { Router } from "express";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { User } from "../types/types";
import nodemailer from "nodemailer";

config();
export const userRoute = Router();

interface UserLogin {
    email: string;
    password: string;
    companyName: string;
}

const secret = process.env.JWT_SECRET ?? (() => { throw new Error("Secret is missing") })();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || ""
    }
});

const forgotPasswordOtp = new Map<string, { otp: string, expires: Date }>();

userRoute.post('/user/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role }: User = req.body;
        console.log(firstName, lastName, email, password, role)

        const adminExists = await prisma.user.findFirst();
        if (adminExists) {
            res.status(400).json({
                status: false,
                message: "Admin already exists. Only one admin is allowed."
            });
            return;
        }

        if (role === 'admin') {
            res.status(403).json({ message: "You cannot register as an admin!" });
            return;
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashPassword,
                role
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
            { email: user.email, role: user.role },
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

userRoute.post("/user/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ status: false, error: "Email is required" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email: email } });
        if (!user) {
            res.status(404).json({ status: false, error: "User not found" });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        forgotPasswordOtp.set(email, { otp, expires });
        console.log(forgotPasswordOtp);

        const emailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Password Reset OTP",
            html: `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 15 minutes.</p>`
        }

        await transporter.sendMail(emailOptions);
        res.json({ status: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
});

userRoute.post('/user/reset-password', async(req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            res.status(400).json({ status: false, error: "Email, OTP, and new password are required" });
            return;
        }

        const record = forgotPasswordOtp.get(email);
        if(!record) {
            res.status(400).json({ status: false, error: "No OTP request found for this email" });
            return;
        }

        const { otp: storeOtp, expires } = record;
        if(expires < new Date()) {
            forgotPasswordOtp.delete(email);
            res.status(400).json({ status: false, error: "OTP has expired. Please request a new one." });
            return;
        }

        if(otp !== storeOtp) {
            res.status(400).json({ status: false, error: "Invalid OTP" });
            return;
        }

        const hashPass = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: {
                password: hashPass
            }
        });

        forgotPasswordOtp.delete(email);
        res.json({ status: true, message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ status: false, error: "Internal Server Error" });
    }
});
