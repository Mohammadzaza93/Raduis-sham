using System;

namespace ISPSystem.Models
{
    public class Payment
    {
        public int Id { get; set; }
        public int ClientId { get; set; }  // بدلاً من UserId
        public int? SubscriptionId { get; set; }
        public int? InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string ReferenceNumber { get; set; }
        public string Notes { get; set; }
        public string Status { get; set; } = "Completed";

        // Navigation properties
        public Client Client { get; set; }
        public Subscription Subscription { get; set; }
        public Invoice Invoice { get; set; }
    }
}