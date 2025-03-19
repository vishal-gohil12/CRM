import { Router } from "express";
import { prisma } from "../index";
import { config } from "dotenv";
import { z } from "zod"; // For input validation
import nodemailer from "nodemailer";
import "../controller/scheduleReminders";

export const reminderRoute = Router();

config();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || ""
  }
});

// Queue to manage reminders
const reminderQueue = new Map();

// Function to add reminder to queue
async function addReminderToQueue(reminder) {
  try {
    // Clear any existing timeout for this reminder
    if (reminderQueue.has(reminder.id)) {
      clearTimeout(reminderQueue.get(reminder.id));
    }

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: reminder.customerId }
    });

    if (!customer || !customer.email) {
      console.error(`Customer not found or no email for reminder ${reminder.id}`);
      return;
    }

    // Calculate time until reminder should be sent
    const now = new Date();
    const reminderTime = new Date(reminder.datetime);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    // If reminder time is in the past, send immediately
    if (timeUntilReminder <= 0) {
      await sendReminderEmail(reminder, customer);
      return;
    }

    // Schedule the reminder
    const timeoutId = setTimeout(async () => {
      await sendReminderEmail(reminder, customer);
      
      // Update reminder status to SENT
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT" }
      });
      
      // Remove from queue
      reminderQueue.delete(reminder.id);
    }, timeUntilReminder);

    // Store the timeout reference
    reminderQueue.set(reminder.id, timeoutId);
    
    console.log(`Reminder ${reminder.id} scheduled for ${reminderTime.toISOString()}`);
  } catch (error) {
    console.error("Error adding reminder to queue:", error);
  }
}

// Function to send reminder email
async function sendReminderEmail(reminder, customer) {
  try {
    const emailOptions = {
      from: process.env.EMAIL_FROM || "reminders@example.com",
      to: customer.email,
      subject: `Reminder: ${reminder.priority} Priority`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <div style="background-color: #ff6b00; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0;">Reminder</h2>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${customer.name},</p>
            <p>${reminder.message}</p>
            <p>Priority: ${reminder.priority}</p>
            <p>Scheduled for: ${new Date(reminder.datetime).toLocaleString()}</p>
            <p>Thank you for your attention to this matter.</p>
          </div>
          <div style="background-color: #f0f0f0; padding: 10px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(emailOptions);
    console.log(`Reminder email sent to ${customer.email}, messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw error;
  }
}

// Define validation schema for reminder creation
const createReminderSchema = z.object({
  customerId: z.string().uuid({ message: "Invalid customer ID format" }),
  transactionId: z.string().uuid({ message: "Invalid transaction ID format" }).nullable().optional(),
  datetime: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    { message: "Datetime must be valid and in the future" }
  ),
  message: z.string().min(1, { message: "Message cannot be empty" }).max(500, { message: "Message too long" }),
  type: z.enum(["SMS", "EMAIL", "PUSH"]).optional().default("EMAIL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM")
});

// Get all reminders for a customer
reminderRoute.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({ status: false, error: "Customer not found" });
    }

    const reminders = await prisma.reminder.findMany({
      where: { customerId },
      orderBy: { datetime: 'asc' }
    });

    res.status(200).json({ status: true, reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// Create a new reminder
reminderRoute.post('/', async (req, res) => {
  try {
    // Validate input using Zod
    const validationResult = createReminderSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        status: false,
        error: "Validation failed",
        details: validationResult.error.format()
      });
    }

    const { customerId, transactionId, datetime, message, type, priority } = validationResult.data;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ status: false, error: "Customer not found" });
    }

    // Check if transaction exists if provided
    if (transactionId) {
      const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction) {
        return res.status(404).json({ status: false, error: "Transaction not found" });
      }
    }

    // Create the reminder
    const scheduledDate = new Date(datetime);
    const reminder = await prisma.reminder.create({
      data: {
        customerId,
        transactionId,
        datetime: scheduledDate,
        message,
        type,
        priority,
        status: "PENDING"
      }
    });

    // Add to processing queue
    await addReminderToQueue(reminder);

    res.status(201).json({
      status: true,
      message: "Reminder created successfully",
      reminder
    });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// Update a reminder
reminderRoute.put('/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { datetime, message, type, priority } = req.body;

    // Check if reminder exists
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId }
    });

    if (!existingReminder) {
      return res.status(404).json({ status: false, error: "Reminder not found" });
    }

    // Validate datetime if provided
    if (datetime) {
      const scheduledDate = new Date(datetime);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        return res.status(400).json({ 
          status: false, 
          error: "Scheduled datetime must be valid and in the future" 
        });
      }
    }

    // Update reminder
    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        ...(datetime && { datetime: new Date(datetime) }),
        ...(message && { message }),
        ...(type && { type }),
        ...(priority && { priority })
      }
    });

    // Update in queue if datetime changed
    if (datetime) {
      await addReminderToQueue(updatedReminder);
    }

    res.status(200).json({
      status: true,
      message: "Reminder updated successfully",
      reminder: updatedReminder
    });
  } catch (error) {
    console.error("Error updating reminder:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// Delete a reminder
reminderRoute.delete('/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;

    // Check if reminder exists
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId }
    });

    if (!existingReminder) {
      return res.status(404).json({ status: false, error: "Reminder not found" });
    }

    // Clear any scheduled reminder
    if (reminderQueue.has(reminderId)) {
      clearTimeout(reminderQueue.get(reminderId));
      reminderQueue.delete(reminderId);
    }

    // Delete reminder
    await prisma.reminder.delete({
      where: { id: reminderId }
    });

    res.status(200).json({
      status: true,
      message: "Reminder deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

// Initialize existing reminders on startup
async function initializeReminders() {
  try {
    const pendingReminders = await prisma.reminder.findMany({
      where: { 
        status: "PENDING",
        datetime: { gte: new Date() }
      }
    });
    
    console.log(`Initializing ${pendingReminders.length} pending reminders`);
    
    for (const reminder of pendingReminders) {
      await addReminderToQueue(reminder);
    }
  } catch (error) {
    console.error("Error initializing reminders:", error);
  }
}

// Initialize reminders when the server starts
initializeReminders();

export { addReminderToQueue };