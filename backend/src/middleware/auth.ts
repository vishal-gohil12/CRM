import { User, PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

config();
export interface RequestUser extends Request {
    user?: User;
}

const prisma = new PrismaClient();

export const authUser = async (req: RequestUser, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if(!token) {
        res.status(401).json({
            Error: "Token is missing"
        });
        return;
    }

    const secret = process.env.JWT_SECRET ??(() => { throw new Error("Secret is missing") })();
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        const email = decoded.email;
        const user = await prisma.user.findUnique({
            where: { email: email }
        });
        if(!user) {
            res.status(401).json({ status: false,error: "User not found" });
            return;
        }
        req.user = user;
        next();

    } catch (err) {
        res.status(401).json({
            Error: "Invalid token"
        });
    }
}   

