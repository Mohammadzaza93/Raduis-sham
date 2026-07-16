using System;

namespace ISPSystem.Models
{
    public class Expense
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; }
        public string Category { get; set; } // Salaries, Rent, Equipment, Marketing, Other
        public DateTime Date { get; set; }
        public string ReferenceNumber { get; set; }
        public string ReceiptImage { get; set; }
        public string Notes { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}