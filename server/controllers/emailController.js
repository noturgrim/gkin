const nodemailer = require("nodemailer");
const { logEmail } = require("./emailHistoryController");

/**
 * Send an email
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const sendEmail = async (req, res) => {
  try {
    const { to, cc, subject, message, documentType, documentLink } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user info from the auth middleware
    const { id: senderId, role: senderRole, username: senderUsername } = req.user;

    // Create a transporter using the provided email credentials
    const transporter = nodemailer.createTransport({
      host: "smtp.privateemail.com", // Correct SMTP server for privateemail.com
      port: 465,
      secure: true, // use SSL
      auth: {
        user: "user2003@andrewscreem.com",
        pass: "$DANdan2003$",
      },
    });

    // Prepare email content with the document link
    let emailContent = message;
    if (documentLink) {
      emailContent += `\n\nYou can access the document here: ${documentLink}`;
    }

    console.log("Attempting to send email to:", to);

    let info;
    let emailLogData = {
      senderId,
      senderRole,
      senderUsername,
      to,
      cc: cc || null,
      subject,
      message: emailContent,
      documentType,
      documentLink,
      status: 'pending'
    };

    try {
      // Prepare the email options
      const mailOptions = {
        from: '"GKIN System" <user2003@andrewscreem.com>',
        to,
        subject,
        text: emailContent,
      };

      // Add CC if provided and not empty
      if (cc && cc.trim()) {
        mailOptions.cc = cc;
      }

      // Send the email
      info = await transporter.sendMail(mailOptions);

      console.log("Email sent successfully: %s", info.messageId);

      // Update email log data with success info
      emailLogData.messageId = info.messageId;
      emailLogData.status = 'sent';

      // Log the successful email to history
      await logEmail(emailLogData);

      res.json({
        message: "Email sent successfully",
        messageId: info.messageId,
      });
      return; // End the function here after successful email
    } catch (emailError) {
      console.error("SMTP Error:", emailError);
      
      // Log the failed email to history
      emailLogData.status = 'failed';
      emailLogData.errorMessage = emailError.message;
      try {
        await logEmail(emailLogData);
      } catch (logError) {
        console.error("Failed to log email error to history:", logError);
      }

      // Log more details about the error
      if (emailError.code === "ECONNREFUSED") {
        console.error(
          "Connection refused. Check if the SMTP server is accessible from your network."
        );
      } else if (emailError.code === "EAUTH") {
        console.error(
          "Authentication failed. Check your username and password."
        );
      }
      throw emailError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ message: "Failed to send email", error: error.message });
  }
};

module.exports = {
  sendEmail,
};
