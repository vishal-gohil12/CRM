import { Router } from "express";
import { authUser } from "../middleware/auth";
import { prisma } from "../index";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary";
import { v4 as uuidv4 } from "uuid";

export const documentRoute = Router();

// Configure Cloudinary storage with better metadata handling
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "customer-documents",
        resource_type: "auto", // Handles all file types
        format: (req: any, file: any) => {
            // Preserve file extension for accurate type recognition later
            const originalExt = file.originalname.split('.').pop();
            // Don't transform PDFs or other non-image formats
            if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(originalExt.toLowerCase())) {
                return originalExt;
            }
            // For images, use original format or convert to PNG if necessary
            return originalExt || 'png';
        },
        public_id: (req: any, file: any) => {
            const baseName = file.originalname.replace(/\.[^/.]+$/, "");
            return `${uuidv4()}-${baseName}`;
        },
        // Important for previewing - ensure files are accessible
        delivery_type: 'upload',
        access_mode: 'public'
    } as any
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for files
});

documentRoute.post("/upload-document", authUser, upload.single("file"), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: false, message: "No file uploaded" });
        }
        
        const { customerId, documentName } = req.body;
        
        if (!customerId) {
            return res.status(400).json({ status: false, message: "Customer ID is required" });
        }
        
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
            return res.status(404).json({ status: false, message: "Customer not found" });
        }
        
        // Extract file information from Cloudinary response
        const fileUrl = req.file.path;
        const publicId = req.file.filename;
        const displayName = documentName || req.file.originalname;
        
        // Store file mime type for accurate preview handling
        const fileType = req.file.mimetype || getFileMimeType(displayName);
        
        const newDocument = await prisma.document.create({
            data: {
                customerId: customerId,
                fileName: displayName,
                filePath: fileUrl,
                cloudinaryId: publicId,
                fileType: fileType, // Add this field to your Prisma model
                fileSize: req.file.size || 0, // Add this field to your Prisma model
            }
        });
        
        res.status(200).json({
            status: true,
            message: "Document uploaded successfully",
            document: newDocument
        });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

documentRoute.get("/get-documents/:customerId", authUser, async (req: any, res: any) => {
    try {
        const { customerId } = req.params;
        
        const documents = await prisma.document.findMany({
            where: { customerId }
        });
        
        res.status(200).json({
            status: true,
            documents
        });
    } catch (error) {
        console.error("Error retrieving documents:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

documentRoute.delete("/delete-document", authUser, async (req: any, res: any) => {
    try {
        const { documentId } = req.body;
        
        if (!documentId) {
            return res.status(400).json({ status: false, message: "Document ID is required" });
        }
        
        const document = await prisma.document.findUnique({ where: { id: documentId } });
        if (!document) {
            return res.status(404).json({ status: false, message: "Document not found" });
        }
        
        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(document.cloudinaryId);
        } catch (cloudinaryError) {
            console.error("Cloudinary deletion error:", cloudinaryError);
            // Continue with database deletion even if Cloudinary fails
        }
        
        // Delete from database
        await prisma.document.delete({ where: { id: documentId } });
        
        res.status(200).json({ status: true, message: "Document deleted successfully" });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

// Helper function to determine MIME type from filename
function getFileMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    
    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'txt': 'text/plain'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
}