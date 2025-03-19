// // scheduleReminders.ts
// import schedule from "node-schedule";
// import nodemailer from "nodemailer";
// import { prisma } from "..";
// import { config } from "dotenv";

// config();

// async function addReminderToQueue() {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.USER,           // e.g., your.email@gmail.com
//       pass: process.env.PASSWORD,     // use an app password if using 2FA
//     },
//   });
  
//   schedule.scheduleJob("*/1 * * * *", async () => {
//     try {
//       const dueReminders = await prisma.reminder.findMany({
//         where: {
//           sent: false,
//           datetime: {
//             lte: new Date(),
//           },
//         },
//         include: {
//           customer: true, 
//         },
//       });
  
//       for (const reminder of dueReminders) {
//         const mailOptions = {
//           from: process.env.USER,
//           to: process.env.SENT_USER, 
//           subject: "Scheduled Reminder",
//           text: reminder.message,
//         };
  
//         try {
//           await transporter.sendMail(mailOptions);
//           console.log(`Reminder email sent to ${reminder.customer.email}`);
  
//           await prisma.reminder.update({
//             where: { id: reminder.id },
//             data: { sent: true },
//           });
//         } catch (emailError) {
//           console.error("Error sending email for reminder", reminder.id, emailError);
//         }
//       }
//     } catch (error) {
//       console.error("Error processing reminders:", error);
//     }
//   });
  
// }