import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { companyRoute } from "./routes/companyRoute";
import { userRoute } from "./routes/userRotue";
import { customerRoute } from "./routes/customerRoute";
import { transactionRouter } from "./routes/transactionsRoute";
import { reminderRoute } from "./routes/reminderRoute";
import { documentRoute } from "./routes/documentRoute";
import { adminRoute } from "./routes/adminRoute";

config();
const app = express();
const PORT = process.env.PORT || 8080;
export const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({
    origin: "*"
}));

app.use('/api/company', companyRoute);
app.use('/api/', userRoute);
app.use('/api/customer', customerRoute);
app.use('/api/transactions', transactionRouter);
app.use('/api/reminders', reminderRoute);
app.use("/api/customer/docs", documentRoute);
app.use("/api/user", adminRoute);

app.get('/', (req, res)=> {
    res.send("hello world");
});

app.listen(PORT, ()=>{
    console.log("server is running on port ", PORT);
});