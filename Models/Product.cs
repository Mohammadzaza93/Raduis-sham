using System;
using System.Collections.Generic;

namespace ISPSystem.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ModelNumber { get; set; }
        public string SerialNumber { get; set; }
        public decimal CostPrice { get; set; }
        public decimal SellPrice { get; set; }
        public int Quantity { get; set; }
        public string Description { get; set; }
        public int? MinStockAlert { get; set; } = 5;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Purchase> Purchases { get; set; }
        public ICollection<Sale> Sales { get; set; }
    }
}