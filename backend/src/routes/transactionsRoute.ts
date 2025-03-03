import { Router } from "express";
import { authUser } from "../middleware/auth";
import { prisma } from "..";

export const transactionRouter = Router();

// Create a new transaction
transactionRouter.post("/", authUser, async (req, res) => {
    try {
        const { companyName, customerEmail, amount, status } = req.body;

        const company = await prisma.company.findFirst({ where: { name: companyName } });
        const customer = await prisma.customer.findFirst({ where: { email: customerEmail, companyId: company?.id } });

        if (!company || !customer) {
            res.status(404).json({
                status: false,
                message: "Company or Customer not found."
            });
            return;
        }

        const transaction = await prisma.transaction.create({
            data: {
                customerId: customer.id,
                amount,
                companyId: company.id,
                status: status || "pending",
            },
            include: { customer: true, company: true } // Ensure related data is included
        });

        res.status(201).json({
            status: true,
            message: "Transaction created successfully.",
            transaction: {
                id: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
                customerName: transaction.customer.name,
                customerEmail: transaction.customer.email,
                companyName: transaction.company.name,
                createdAt: transaction.createdAt
            }
        });

    } catch (err) {
        console.error("Error creating transaction:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Update an existing transaction
transactionRouter.put("/", authUser, async (req, res) => {
    try {
        const { companyName, customerEmail, amount, status } = req.body;

        const company = await prisma.company.findFirst({ where: { name: companyName } });
        const customer = await prisma.customer.findFirst({ where: { email: customerEmail, companyId: company?.id } });

        if (!company || !customer) {
            res.status(404).json({
                status: false,
                message: "Company or Customer not found."
            });
            return;
        }

        const transaction = await prisma.transaction.findFirst({
            where: { customerId: customer.id, companyId: company.id },
            orderBy: { createdAt: "desc" }
        });

        if (!transaction) {
            res.status(404).json({
                status: false,
                message: "Transaction not found for this customer."
            });
            return;
        }

        const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                amount: amount,
                status: status || transaction.status,
            },
            include: { customer: true, company: true }
        });

        res.status(200).json({
            status: true,
            message: "Transaction updated successfully.",
            transaction: {
                id: updatedTransaction.id,
                amount: updatedTransaction.amount,
                status: updatedTransaction.status,
                customerName: updatedTransaction.customer.name,
                customerEmail: updatedTransaction.customer.email,
                companyName: updatedTransaction.company.name,
                createdAt: transaction.createdAt
            }
        });

    } catch (err) {
        console.error("Error updating transaction:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Get all transactions
transactionRouter.get("/get_all", authUser, async (req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true,
                customer: {
                    select: { name: true, email: true }
                },
                company: {
                    select: { name: true }
                }
            }
        });

        const formattedTransactions = transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount,
            status: tx.status,
            createdAt: tx.createdAt,
            customerName: tx.customer?.name || "N/A",
            customerEmail: tx.customer?.email || "N/A",
            companyName: tx.company?.name || "N/A"
        }));

        res.status(200).json({
            status: true,
            message: "Transactions retrieved successfully.",
            transactions: formattedTransactions
        });

    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

transactionRouter.delete("/:id", authUser, async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({ where: { id } });

        if (!transaction) {
            res.status(404).json({
                status: false,
                message: "Transaction not found."
            });
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