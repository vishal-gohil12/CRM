import { Router } from "express";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { config } from "dotenv";

config();
export const adminRoute = Router();

const adminCreationOtp = new Map<string, { otp: string, expires: Date }>();

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || ""
    }
});


adminRoute.post('/admin/create-request', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email input
        if (!email) {
            res.status(400).json({
                status: false,
                error: "Email is required"
            });
            return;
        }

        // Check if an admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            res.status(400).json({
                status: false,
                error: "An admin user already exists. Cannot create another admin."
            });
            return
        }

        // Check if email is already registered
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            res.status(400).json({
                status: false,
                error: "Email is already registered"
            });
            return
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store OTP
        adminCreationOtp.set(email, { otp, expires });

        // Prepare email options
        const emailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "OTP for Admin User Creation",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Admin User Creation</h2>
                    <p>Your One-Time Password (OTP) for creating an admin user is:</p>
                    <h3 style="background-color: #f4f4f4; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h3>
                    <p>This OTP is valid for 15 minutes. Do not share it with anyone.</p>
                    <small>If you did not request this, please ignore this email.</small>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(emailOptions);

        res.json({
            status: true,
            message: "OTP sent to your email for admin user creation"
        });

    } catch (error) {
        console.error("Admin Creation Request Error:", error);
        res.status(500).json({
            status: false,
            error: "Internal Server Error"
        });
    }
});

// Route to create admin user
adminRoute.post('/admin/create-user', async (req, res) => {
    try {
        const { email, otp, adminUsername, adminPassword } = req.body;

        // Validate inputs
        if (!email || !otp || !adminUsername || !adminPassword) {
            res.status(400).json({
                status: false,
                error: "All fields are required"
            });
            return
        }

        // Check if an admin already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            res.status(400).json({
                status: false,
                error: "An admin user already exists. Cannot create another admin."
            });
            return
        }

        // Verify OTP
        const otpRecord = adminCreationOtp.get(email);
        if (!otpRecord) {
            res.status(400).json({
                status: false,
                error: "No OTP request found for this email"
            });
            return
        }

        // Check OTP expiration
        if (otpRecord.expires < new Date()) {
            adminCreationOtp.delete(email);
            res.status(400).json({
                status: false,
                error: "OTP has expired. Please request a new one."
            });
            return
        }

        // Verify OTP
        if (otp !== otpRecord.otp) {
            res.status(400).json({
                status: false,
                error: "Invalid OTP"
            });
            return
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        const adminUser = await prisma.user.create({
            data: {
                email,
                firstName: adminUsername,
                lastName: 'Admin',
                password: hashedPassword,
                role: 'admin'
            }
        });

        // Clear OTP after successful creation
        adminCreationOtp.delete(email);

        res.status(201).json({
            status: true,
            message: "Admin user created successfully"
        });

    } catch (error) {
        console.error("Admin User Creation Error:", error);
        res.status(500).json({
            status: false,
            error: "Internal Server Error"
        });
    }
});