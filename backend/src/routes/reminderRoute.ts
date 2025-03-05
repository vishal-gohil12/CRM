import { Router } from "express";
import nodemailer from "nodemailer";
import { prisma } from "../index";
import schedule from "node-schedule";
import { config } from "dotenv";

export const reminderRoute = Router();

config();

reminderRoute.post('/', async (req, res) => {
    try {
        const { id, datetime, message } = req.body;
        if (!id || !datetime || !message) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const scheduledDate = new Date(datetime);
        if(isNaN(scheduledDate.getTime())) {
            res.status(400).json({ error: "Invalid datetime provided" });
            return;
        }

        if(scheduledDate <= new Date()) {
            res.status(400).json({ error: "Scheduled datetime must be in the future" });
            return;
        };

        const customer = await prisma.customer.findUnique({ where: { id } });
        if (!customer) {
            res.status(404).json({ error: "Customer not found" });
            return;
        }

        const reminder = await prisma.reminder.create({
            data: {
                customerId: id,
                datetime: scheduledDate,
                message
            }
        });

         res.status(200).json({
            message: "Reminder created successfully",
            reminder,
        });
    } catch (error) {
        console.error("Error scheduling reminder:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});