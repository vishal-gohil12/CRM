import { Router } from "express";
import { authUser } from "../middleware/auth";
import { prisma } from "..";
import { z } from "zod";

export const transactionRouter = Router();

const transactionSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    customerEmail: z.string().email("Invalid email"),
    totalAmount: z.number().positive("Total amount must be positive"),
    paidAmount: z.number().nonnegative("Paid amount must be non-negative"),
    status: z.enum(["pending", "completed", "cancelled"]).optional(),
    payment_type: z.string().optional()
});

transactionRouter.post("/", authUser, async (req, res) => {
    try {
        const parsedBody = transactionSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ status: false, message: parsedBody.error.errors });
            return;
        }
        const { companyName, customerEmail, totalAmount, paidAmount, status, payment_type } = parsedBody.data;

        const company = await prisma.company.findFirst({ where: { name: companyName } });
        const customer = await prisma.customer.findFirst({ where: { email: customerEmail, companyId: company?.id } });

        if (!company || !customer) {
            res.status(404).json({ status: false, message: "Company or Customer not found." });
            return;
        }

        const pendingAmount = totalAmount - paidAmount;

        const transaction = await prisma.transaction.create({
            data: {
                customerId: customer.id,
                companyId: company.id,
                totalAmount,
                paidAmount,
                pendingAmount,
                status: status || "pending",
                payment_type: payment_type || "cash"
            },
            include: { customer: true, company: true }
        });

        res.status(201).json({
            status: true,
            message: "Transaction created successfully.",
            transaction
        });
    } catch (err) {
        console.error("Error creating transaction:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Update an existing transaction
transactionRouter.put("/", authUser, async (req, res) => {
    try {
        const parsedBody = transactionSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ status: false, message: parsedBody.error.errors });
            return;
        }
        const { companyName, customerEmail, totalAmount, paidAmount, status, payment_type } = parsedBody.data;

        const company = await prisma.company.findFirst({ where: { name: companyName } });
        const customer = await prisma.customer.findFirst({ where: { email: customerEmail, companyId: company?.id } });

        if (!company || !customer) {
            res.status(404).json({ status: false, message: "Company or Customer not found." });
            return;
        }

        const transaction = await prisma.transaction.findFirst({
            where: { customerId: customer.id, companyId: company.id },
            orderBy: { createdAt: "desc" }
        });

        if (!transaction) {
            res.status(404).json({ status: false, message: "Transaction not found for this customer." });
            return;
        }

        const pendingAmount = totalAmount - paidAmount;

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                totalAmount,
                paidAmount,
                pendingAmount,
                status: status || transaction.status,
                payment_type: payment_type || transaction.payment_type
            },
            include: { customer: true, company: true }
        });

        res.status(200).json({
            status: true,
            message: "Transaction updated successfully.",
            transaction: updatedTransaction
        });
    } catch (err) {
        console.error("Error updating transaction:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Get all transactions
transactionRouter.get("/get_all", authUser, async (req, res) => {
    try {
        const { companyName } = req.body;
        const transactions = await prisma.transaction.findMany({
            where: { company: companyName },
            select: {
                id: true,
                totalAmount: true,
                paidAmount: true,
                pendingAmount: true,
                status: true,
                payment_type: true,
                createdAt: true,
                customer: { select: { company_and_name: true, email: true } },
                company: { select: { name: true } }
            }
        });

        res.status(200).json({
            status: true,
            message: "Transactions retrieved successfully.",
            transactions
        });
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Delete a transaction
transactionRouter.delete("/:id", authUser, async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({ where: { id } });

        if (!transaction) {
            res.status(404).json({ status: false, message: "Transaction not found." });
            return;
        }

        await prisma.transaction.delete({ where: { id } });

        res.status(200).json({
            status: true,
            message: "Transaction deleted successfully."
        });
    } catch (err) {
        console.error("Error deleting transaction:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});