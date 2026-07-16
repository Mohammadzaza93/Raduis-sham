using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.Models;
using Microsoft.AspNetCore.Mvc;

namespace ISPSystem.Services
{
    public class SaleService
    {
        private readonly AppDbContext _context;

        public SaleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Sale> Sell(int productId, int qty)
        {
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
                throw new Exception("Product not found");

            if (product.Quantity < qty)
                throw new Exception("Insufficient stock");

            product.Quantity -= qty;

            var sale = new Sale
            {
                ProductId = productId,
                Quantity = qty,
                Customer = "Client",
                Total = product.SellPrice * qty,
                Date = DateTime.Now
            };

            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            return sale;
        }
    }
}
