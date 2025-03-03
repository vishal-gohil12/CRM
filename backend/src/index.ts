import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { companyRotue } from "./routes/companyRoute";
import { userRoute } from "./routes/userRotue";
import { customerRoute } from "./routes/customerRoute";
import { transactionRouter } from "./routes/transactionsRoute";

config();
const app = express();
const PORT = process.env.PORT || 8080;
export const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({
    origin: "*"
}));

app.use('/api/company', companyRotue);
app.use('/api/', userRoute);
app.use('/api/customer', customerRoute);
app.use('/api/transactions', transactionRouter);

app.get('/', (req, res)=> {
    res.send("hello world");
});

app.listen(PORT, ()=>{
    console.log("server is running on port ", PORT);
});