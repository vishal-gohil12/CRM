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
}

interface EmailConfig {
  email: string;
  appPass: string;
}

const emailConfigs: Map<string, EmailConfig> = new Map([
  ['email1', { 
    email: process.env.EMAIL_USER_SUNFIBER || '', 
    appPass: process.env.EMAIL_PASS_SUNFIBER || '' 
  }],
  ['email2', { 
    email: process.env.EMAIL_USER_JYOTI_TRADING || '', 
    appPass: process.env.EMAIL_PASS_JYOTI_TRADING || '' 
  }],
  ['email3', { 
    email: process.env.EMAIL_USER_LAXMI_ENG || '', 
    appPass: process.env.EMAIL_PASS_LAXMI_ENG || '' 
  }],
  ['email4', { 
    email: process.env.EMAIL_USER_POOJA_ENG || '', 
    appPass: process.env.EMAIL_PASS_POOJA_ENG || '' 
  }],
  ['email5', { 
    email: process.env.EMAIL_USER_BEAST || '', 
    appPass: process.env.EMAIL_PASS_BEAST || '' 
  }]
])

function getEmailTransporter(emailKey: string) {
  const config = emailConfigs.get(emailKey);
  if(!config) {
    throw new Error(`Email configuration not found for key: ${emailKey}`);
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.email,
      pass: config.appPass
    }
  });
}

const reminderQueue = new Map<string, NodeJS.Timeout>();

async function addReminderToQueue(reminder: ReminderInterface & { subject?: string, emailKey: string }) {
  try {
    if (!reminder || !reminder.id || !reminder.datetime) {
      console.error("Invalid reminder object:", reminder);
      return;
    }

    if (reminderQueue.has(reminder.id)) {
      clearTimeout(reminderQueue.get(reminder.id));
    }

    const customer = await prisma.customer.findUnique({
      where: { id: reminder.customerId },
    });

    if (!customer || !customer.email) {
      console.error(
        `Customer not found or no email for reminder ${reminder.id}`
      );
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
        data: { status: "SENT" },
      });

      reminderQueue.delete(reminder.id);
    }, timeUntilReminder);

    reminderQueue.set(reminder.id, timeoutId);

    console.log(
      `Reminder ${reminder.id} scheduled for ${reminderTime.toISOString()}`
    );
  } catch (error) {
    console.error("Error adding reminder to queue:", error);
  }
}

async function sendReminderEmail(
  reminder: {
    message: any;
    datetime: string | number | Date;
    recipient?: string;
    subject?: string;
    emailKey: string
  },
  customer: {
    id: string;
    companyId: string;
    email: string;
    phone: string | null;
    createdAt: Date;
    remark: string | null;
    documents?: Document[];
    gst_no: string;
    company_and_name: string;
  }
) {
  try {
    const recipient = reminder.recipient || "company";
    const emailKey = reminder.emailKey;

    const transporter = getEmailTransporter(emailKey);
    const config = emailConfigs.get(emailKey);

    if (!config) {
      throw new Error(`No email configuration found for key: ${emailKey}`);
    }

    const emailTo =
      recipient === "admin"
        ? process.env.ADMIN_EMAIL || ""
        : customer.email;

    const emailOptions = {
      from: config.email,
      to: emailTo,
      subject: reminder.subject || "Reminder Notification",
      html: `
        <html>
    <head>
      <meta charset="UTF-8">
      <title>Reminder Email</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Helvetica, Arial, sans-serif;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;">
        <!-- Header -->
        <tr>
          <td align="center" bgcolor="#ff6b00" style="padding: 20px; color: #ffffff; font-size: 24px; font-weight: bold;">
            Reminder
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding: 30px; color: #333333; font-size: 16px; line-height: 1.5;">
            <p style="margin: 0 0 20px;">Dear ${
              recipient === "admin" ? "Admin" : customer.company_and_name
            },</p>
            ${
              recipient === "admin"
                ? `<p style="margin: 0 0 20px;">Reminder for customer: ${customer.company_and_name}</p>
                  <p>About : ${reminder.message} </p>
                `
                : `<p style="margin: 0 0 20px;">${reminder.message}</p>`
            }
            <p style="margin: 0;">Thank you for your attention to this matter.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" bgcolor="#f0f0f0" style="padding: 15px; font-size: 12px; color: #666666;">
            <p style="margin: 0;">This is an automated reminder. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </body>
  </html>
      `,
    };

    const info = await transporter.sendMail(emailOptions);
    console.log(
      `Reminder email sent to ${config.email} to ${emailTo}, messageId: ${info.messageId}`
    );
    return info;
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw error;
  }
}

const createReminderSchema = z.object({
  customerId: z.string().uuid({ message: "Invalid customer ID format" }),
  transactionId: z
    .string()
    .uuid({ message: "Invalid transaction ID format" })
    .nullable()
    .optional(),
  datetime: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    { message: "Datetime must be valid and in the future" }
  ),
  message: z
    .string()
    .min(1, { message: "Message cannot be empty" })
    .max(500, { message: "Message too long" }),
  recipient: z.enum(["company", "admin"]).optional().default("company"),
  subject: z.string().optional(),
  emailKey: z.enum([
    'email1', 'email2', 'email3', 'email4', 'email5'
  ]).optional().default('email1')
});

reminderRoute.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      res.status(404).json({ status: false, error: "Customer not found" });
      return;
    }

    const reminders = await prisma.reminder.findMany({
      where: { customerId },
      orderBy: { datetime: "asc" },
    });

    res.status(200).json({ status: true, reminders });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

reminderRoute.post("/", async (req, res) => {
  try {
    const validationResult = createReminderSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        status: false,
        error: "Validation failed",
        details: validationResult.error.format(),
      });
      return;
    }

    const { customerId, transactionId, datetime, message, recipient, subject, emailKey } =
      validationResult.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      res.status(404).json({ status: false, error: "Customer not found" });
      return;
    }

    if (transactionId) {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
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
        ...(recipient && { recipient }),
        ...(emailKey && { emailKey })
      },
    });
    
    await addReminderToQueue({ ...reminder, subject, emailKey });

    res.status(201).json({
      status: true,
      message: "Reminder created successfully",
      reminder,
    });
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    res.status(500).json({ status: false, error: "Internal server error" });
  }
});

reminderRoute.delete("/:reminderId", async (req, res) => {
  try {
    const { reminderId } = req.params;

    const existingReminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
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
      where: { id: reminderId },
    });

    res.status(200).json({
      status: true,
      message: "Reminder deleted successfully",
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
        datetime: { gte: new Date() },
      },
    });

    console.log(`Initializing ${pendingReminders.length} pending reminders`);

    await Promise.all(
      pendingReminders.map(async (reminder) => {
        // Add additional null/undefined check
        if (reminder && reminder.id && reminder.customerId) {
          try {
            await addReminderToQueue(reminder);
          } catch (error) {
            console.error(
              `Error adding reminder ${reminder.id} to queue:`,
              error
            );
          }
        } else {
          console.warn("Skipping invalid reminder:", reminder);
        }
      })
    );
  } catch (error) {
    console.error("Error initializing reminders:", error);
  }
}

initializeReminders();

export { addReminderToQueue };
