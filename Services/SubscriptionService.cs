using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ISPSystem.Data;
using ISPSystem.DTOs;
using ISPSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ISPSystem.Services
{
    public class SubscriptionService
    {
        private readonly AppDbContext _context;

        public SubscriptionService(AppDbContext context)
        {
            _context = context;
        }

        // إنشاء اشتراك جديد
        public async Task<Subscription> Subscribe(int clientId, int planId, int? customDays = null)
        {
            var client = await _context.Clients.FindAsync(clientId);
            if (client == null)
                throw new Exception("Client not found");

            var plan = await _context.Plans.FindAsync(planId);
            if (plan == null)
                throw new Exception("Plan not found");

            var days = customDays ?? plan.DurationDays;

            var sub = new Subscription
            {
                ClientId = clientId,
                PlanId = planId,
                StartDate = DateTime.Now,
                EndDate = DateTime.Now.AddDays(days),
                IsActive = true,
                Status = "Active",
                PaidAmount = plan.Price
            };

            _context.Subscriptions.Add(sub);
            await _context.SaveChangesAsync();

            return sub;
        }

        public async Task<List<Subscription>> GetAll()
        {
            return await _context.Subscriptions
                .Include(s => s.Client)
                .Include(s => s.Plan)
                .ToListAsync();
        }

        // تمديد اشتراك
        public async Task<Subscription> Renew(int clientId)
        {
            var sub = await _context.Subscriptions
                .Include(x => x.Plan)
                .Where(x => x.ClientId == clientId)
                .OrderByDescending(x => x.EndDate)
                .FirstOrDefaultAsync();

            if (sub == null)
                throw new Exception("Subscription not found");

            var duration = sub.Plan.DurationDays;

            sub.EndDate = sub.EndDate > DateTime.Now
                ? sub.EndDate.AddDays(duration)
                : DateTime.Now.AddDays(duration);

            sub.IsActive = true;
            sub.Status = "Active";
            sub.RenewedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return sub;
        }

        public async Task<Subscription> GetById(int id)
        {
            return await _context.Subscriptions
                .Include(s => s.Client)
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Subscription> Update(int id, UpdateSubscriptionDto dto)
        {
            var sub = await _context.Subscriptions.FindAsync(id);
            if (sub == null)
                return null;

            sub.PlanId = dto.PlanId;
            sub.ClientId = dto.UserId;  // UserId في الـ DTO هو ClientId
            sub.StartDate = DateTime.Now;
            sub.EndDate = DateTime.Now.AddDays(dto.Days);
            sub.IsActive = true;

            await _context.SaveChangesAsync();
            return sub;
        }
    }
}