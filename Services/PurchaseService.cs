using System;
using System.Linq;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.DTOs;
using ISPSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ISPSystem.Services
{
    public class PurchaseService
    {
        private readonly AppDbContext _context;

        public PurchaseService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> GetAll(int page = 1, int pageSize = 20)
        {
            var total = await _context.Purchases.CountAsync();

            var data = await _context.Purchases
                .Include(p => p.Product)
                .OrderByDescending(p => p.Date)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.ProductId,
                    ProductName = p.ProductName ?? p.Product.Name,
                    ModelNumber = p.ModelNumber ?? p.Product.ModelNumber,
                    p.Quantity,
                    p.CostPerUnit,
                    p.Total,
                    p.Supplier,
                    p.InvoiceNumber,
                    p.Date,
                    p.Notes
                })
                .ToListAsync();

            return new { total, page, pageSize, data };
        }

        public async Task<Purchase> Create(CreatePurchaseDto dto)
        {
            if (dto.Quantity <= 0)
                throw new Exception("«·ﬂ„Ì… ÌÃ» √‰  ﬂÊ‰ √ﬂ»— „‰ ’›—");

            if (dto.CostPerUnit < 0)
                throw new Exception("”⁄— «·ÊÕœ… €Ì— ’«·Õ");

            Product product;

            if (dto.ProductId.HasValue && dto.ProductId > 0)
            {
                product = await _context.Products.FindAsync(dto.ProductId.Value);
                if (product == null)
                    throw new Exception("«·„‰ Ã €Ì— „ÊÃÊœ");
            }
            else
            {
                // ≈‰‘«¡ „‰ Ã ÃœÌœ ≈–« ·„ ÌıÕœœ ProductId
                if (string.IsNullOrWhiteSpace(dto.ProductName))
                    throw new Exception("ÌÃ»  ÕœÌœ „‰ Ã „ÊÃÊœ √Ê ≈œŒ«· «”„ „‰ Ã ÃœÌœ");

                product = new Product
                {
                    Name = dto.ProductName.Trim(),
                    ModelNumber = dto.ModelNumber?.Trim(),
                    CostPrice = dto.CostPerUnit,
                    SellPrice = dto.CostPerUnit * 1.3m, // Â«„‘ «› —«÷Ì 30%
                    Quantity = 0,
                    IsActive = true,
                    CreatedAt = DateTime.Now
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();
            }

            var total = dto.CostPerUnit * dto.Quantity;

            var purchase = new Purchase
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ModelNumber = product.ModelNumber,
                Quantity = dto.Quantity,
                CostPerUnit = dto.CostPerUnit,
                Total = total,
                Supplier = dto.Supplier?.Trim(),
                InvoiceNumber = dto.InvoiceNumber?.Trim(),
                Date = DateTime.Now,
                Notes = dto.Notes
            };

            //  ÕœÌÀ ﬂ„Ì… «·„Œ“Ê‰
            product.Quantity += dto.Quantity;

            //  ÕœÌÀ ”⁄— «·‘—«¡ ›Ì «·„‰ Ã („‰ ¬Œ— ‘—«¡)
            if (dto.UpdateProductCostPrice)
            {
                product.CostPrice = dto.CostPerUnit;
            }

            product.UpdatedAt = DateTime.Now;

            _context.Purchases.Add(purchase);
            await _context.SaveChangesAsync();

            return purchase;
        }
    }
}