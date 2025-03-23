import { Router } from "express";
import { prisma } from "../index";
import { config } from "dotenv";
import { z } from "zod";
import nodemailer from "nodemailer";

export const reminderRoute = Router();

config();

interface ReminderInterface {
  id: string; 
  createdAt: Date; 
  customerId: string; 
  datetime: Date; 
  message: string; 
  transactionId: string | null; 
  status: string; 
  type: string; 
  priority: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",  
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || ""
  }
});

const reminderQueue = new Map<string, NodeJS.Timeout>();

async function addReminderToQueue(reminder: ReminderInterface) {
  try {
    if (!reminder || !reminder.id || !reminder.datetime) {
      console.error("Invalid reminder object:", reminder);
      return;
    }

    if (reminderQueue.has(reminder.id)) {
      clearTimeout(reminderQueue.get(reminder.id));
    }

    const customer = await prisma.customer.findUnique({
      where: { id: reminder.customerId }
    });

    if (!customer || !customer.email) {
      console.error(`Customer not found or no email for reminder ${reminder.id}`);
      return;
    }

    const now = new Date();
    const reminderTime = new Date(reminder.datetime);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder <= 0) {
      await sendReminderEmail(reminder, customer);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await sendReminderEmail(reminder, customer);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT" }
      });

      reminderQueue.delete(reminder.id);
    }, timeUntilReminder);

    reminderQueue.set(reminder.id, timeoutId);

    console.log(`Reminder ${reminder.id} scheduled for ${reminderTime.toISOString()}`);
  } catch (error) {
    console.error("Error adding reminder to queue:", error);
  }
}

async function sendReminderEmail(reminder: { priority: string; message: any; datetime: string | number | Date; recipient?: string; }, customer: { id: string; companyId: string; email: string; phone: string | null; createdAt: Date; remark: string | null; documents?: Document[]; gst_no: number; company_and_name: string; }) {
  try {
    const priority = reminder.priority || "MEDIUM";
    const recipient = reminder.recipient || "company";

    const emailTo = recipient === "admin" ? process.env.ADMIN_EMAIL || "21it039@charusat.edu.in" : customer.email;

    const emailOptions = {
      from: process.env.EMAIL_USER,
      to: emailTo,
      subject: `Reminder: ${priority} Priority`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 5px;">
          <div style="background-color: #ff6b00; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0;">Reminder</h2>
          </div>
          <div style="padding: 20px;">
            <p>Dear  ${recipient === "admin" 
              ? `<p>Reminder for customer: ${customer.company_and_name}</p>` 
              : `<p>Dear ${customer.company_and_name},</p>`
            },</p>
            <p>${reminder.message}</p>
            <p>Thank you for your attention to this matter.</p>
          </div>
          <div style="background-color: #f0f0f0; padding: 10px; border-radius: 0 0 5px 5px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(emailOptions);
    console.log(`Reminder email sent to ${emailTo}, messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw error;
  }
}

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
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
  recipient: z.enum(["company", "admin"]).optional().default("company")
});

reminderRoute.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      res.status(404).json({ status: false, error: "Customer not found" });
      return;
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

reminderRoute.post('/', async (req, res) => {
  try {
    const validationResult = createReminderSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        status: false,
        error: "Validation failed",
        details: validationResult.error.format()
      });
      return;
    }

    const { customerId, transactionId, datetime, message, type, priority, recipient } = validationResult.data;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ status: false, error: "Customer not found" });
      return;
    }

    if (transactionId) {
      const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
      if (!transaction) {
        res.status(404).json({ status: false, error: "Transaction not found" });
        return;
      }
    }

    const scheduledDate = new Date(datetime);
    const reminder = await prisma.reminder.create({
      data: {
        customerId,
        transactionId,
        datetime: scheduledDate,
        message,
        status: "PENDING", 
        ...(type && { type }),
        ...(priority && { priority }),
        ...(recipient && { recipient })
      }
    });

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

reminderRoute.put('/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;
    const { datetime, message, type, priority } = req.body;

    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId }
    });

    if (!existingReminder) {
      res.status(404).json({ status: false, error: "Reminder not found" });
      return;
    }

    if (datetime) {
      const scheduledDate = new Date(datetime);
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        res.status(400).json({
          status: false,
          error: "Scheduled datetime must be valid and in the future"
        });
        return;
      }
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        ...(datetime && { datetime: new Date(datetime) }),
        ...(message && { message }),
        ...(type && { type }),
        ...(priority && { priority }),
        ...(datetime && { status: "PENDING" })
      }
    });

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

reminderRoute.delete('/:reminderId', async (req, res) => {
  try {
    const { reminderId } = req.params;

    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId }
    });

    if (!existingReminder) {
      res.status(404).json({ status: false, error: "Reminder not found" });
      return;
    }

    if (reminderQueue.has(reminderId)) {
      clearTimeout(reminderQueue.get(reminderId));
      reminderQueue.delete(reminderId);
    }

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
      if (!reminder) continue;
      await addReminderToQueue(reminder);
    }
  } catch (error) {
    console.error("Error initializing reminders:", error);
  }
}

initializeReminders();

export { addReminderToQueue };