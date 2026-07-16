using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace ISPSystem.Models
{
    public class Purchase
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal CostPerUnit { get; set; }
        public string Supplier { get; set; }
        public decimal Total { get; set; }
        public DateTime Date { get; set; }
        public Product Product { get; set; }
    }

}
