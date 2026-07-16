using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ISPSystem.Services
{
    public class PaymentService
    {
        private readonly AppDbContext _context;

        public PaymentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Payment> Pay(int clientId, decimal amount)
        {
            var client = await _context.Clients.FindAsync(clientId);
            if (client == null)
                throw new Exception("Client not found");

            var activeSubscription = await _context.Subscriptions
                .Include(s => s.Plan)
                .Where(x => x.ClientId == clientId && x.IsActive)
                .OrderByDescending(x => x.EndDate)
                .FirstOrDefaultAsync();

            if (activeSubscription == null)
                throw new Exception("No active subscription found");

            var duration = activeSubscription.Plan.DurationDays;
            var newEndDate = activeSubscription.EndDate > DateTime.Now
                ? activeSubscription.EndDate.AddDays(duration)
                : DateTime.Now.AddDays(duration);

            activeSubscription.EndDate = newEndDate;
            activeSubscription.PaidAmount += amount;

            var payment = new Payment
            {
                ClientId = clientId,
                Amount = amount,
                Date = DateTime.Now,
                Status = "Completed"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return payment;
        }

        public async Task<IEnumerable<Payment>> GetAll()
        {
            return await _context.Payments
                .Include(p => p.Client)
                .OrderByDescending(p => p.Date)
                .ToListAsync();
        }
    }
}