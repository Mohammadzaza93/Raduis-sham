using System;
using System.Collections.Generic;

namespace ISPSystem.Models
{
    public class Product
    {
        public int Id { get; set; }

        public string Name { get; set; }                 // اسم المنتج
        public string ModelNumber { get; set; }           // رقم الموديل
        public string SerialNumber { get; set; }          // سيريال نمبر (اختياري)

        public decimal CostPrice { get; set; }            // سعر الشراء
        public decimal SellPrice { get; set; }            // سعر المبيع
        public int Quantity { get; set; }                 // الكمية الحالية

        public string Description { get; set; }
        public int? MinStockAlert { get; set; } = 5;      // تنبيه انخفاض المخزون
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Purchase> Purchases { get; set; }
        public ICollection<Sale> Sales { get; set; }
    }
}