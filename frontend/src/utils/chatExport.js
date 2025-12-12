import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportChatToPDF = async (messages, selectedDiscovery = null) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.text("AI Chat Conversation", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text(
      `Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 5;
    doc.text(`${messages.length} messages`, pageWidth / 2, currentY, {
      align: "center",
    });

    if (selectedDiscovery) {
      currentY += 10;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Discovery Context:", 20, currentY);
      currentY += 6;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const contextText = doc.splitTextToSize(
        selectedDiscovery.criteria || "No criteria",
        pageWidth - 40
      );
      doc.text(contextText, 20, currentY);
      currentY += contextText.length * 5;
    }

    currentY += 15;

    const stripMarkdown = (text) => {
      return text
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/!\[.*?\]\(.+?\)/g, "")
        .replace(/>\s/g, "")
        .replace(/^\s*[-*+]\s/gm, "• ")
        .replace(/^\s*\d+\.\s/gm, "")
        .trim();
    };

    // Messages
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    messages.forEach((message, idx) => {
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }

      const isUser = message.role === "user";

      // Role label
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.setTextColor(isUser ? 79 : 34, isUser ? 70 : 197, isUser ? 229 : 94);
      doc.text(isUser ? "You:" : "Assistant:", 20, currentY);
      currentY += 7;

      // Message content - STRIP MARKDOWN
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      const cleanContent = stripMarkdown(message.content);
      const contentLines = doc.splitTextToSize(cleanContent, pageWidth - 40);

      doc.text(contentLines, 20, currentY);
      currentY += contentLines.length * 5 + 10;

      // Divider
      if (idx < messages.length - 1) {
        doc.setDrawColor(220, 220, 220);
        doc.line(20, currentY, pageWidth - 20, currentY);
        currentY += 8;
      }
    });

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(
        `ChemDiscovery AI - Chat Export`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, {
        align: "right",
      });
    }

    // Save
    const filename = `chat-export-${Date.now()}.pdf`;
    doc.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("PDF Export Error:", error);
    return { success: false, error: error.message };
  }
};

export const exportChatToTXT = (messages, selectedDiscovery = null) => {
  try {
    let content = "AI CHAT CONVERSATION\n";
    content += "=".repeat(60) + "\n\n";
    content += `Exported: ${new Date().toLocaleString()}\n`;
    content += `Messages: ${messages.length}\n`;

    if (selectedDiscovery) {
      content += "\nDISCOVERY CONTEXT:\n";
      content += selectedDiscovery.criteria || "No criteria";
      content += "\n";
    }

    content += "\n" + "=".repeat(60) + "\n\n";

    messages.forEach((message, idx) => {
      const isUser = message.role === "user";
      content += `[${isUser ? "YOU" : "AI"}] ${new Date(
        message.createdAt
      ).toLocaleString()}\n`;
      content += message.message + "\n";

      if (idx < messages.length - 1) {
        content += "\n" + "-".repeat(60) + "\n\n";
      }
    });

    content += "\n" + "=".repeat(60) + "\n";
    content += "End of conversation\n";

    // Download
    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-export-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("TXT Export Error:", error);
    return { success: false, error: error.message };
  }
};

export const exportChatToJSON = (messages, selectedDiscovery = null) => {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      discoveryContext: selectedDiscovery || null,
      messages: messages.map((msg) => ({
        role: msg.role,
        message: msg.message,
        createdAt: msg.createdAt,
        sessionId: msg.sessionId,
      })),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("JSON Export Error:", error);
    return { success: false, error: error.message };
  }
};
