using System;
using System.Collections.Generic;

namespace ISPSystem.Models
{
    public class Client
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string MacAddress { get; set; }
        public string IpAddress { get; set; }
        public string Address { get; set; }
        public string NationalId { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastLogin { get; set; }
        public int? CreatedBy { get; set; } // معرف الموظف الذي أضافه

        // Relationships
        public ICollection<Subscription> Subscriptions { get; set; }
        public ICollection<Payment> Payments { get; set; }
        public ICollection<Invoice> Invoices { get; set; }
        public string ClientType { get; set; } = "Regular"; // Regular, VIP, Corporate
                                                            // أو يمكن استخدام Role إذا أردت توحيد الأسماء
        public string Role { get; set; } = "Client";
        public ICollection<Device> Devices { get; set; }
    }
}