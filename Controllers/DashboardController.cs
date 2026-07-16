using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ISPSystem.Data;
using ISPSystem.Helpers;
using ISPSystem.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ISPSystem.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly MikroTikService _mikroTik;

        public DashboardController(AppDbContext context, MikroTikService mikroTik)
        {
            _context = context;
            _mikroTik = mikroTik;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            // 🌍 توحيد التوقيت الحالي لضمان عدم حدوث تضارب فوارق الساعات في السيرفر والحاويات
            var now = DateTime.Now;
            var today = now.Date;
            var threeDaysFromNow = today.AddDays(3);

            // 📡 1. جلب بيانات ميكروتيك بشكل منفصل ومحمي لتجنب تعليق اللوحة عند سقوط الاتصال بالراوتر
            var onlineClients = 0;
            try
            {
                var online = await _mikroTik.GetActiveUsers();
                onlineClients = online?.Count ?? 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MikroTik Connection Error: {ex.Message}");
            }

            // 👥 2. استعلام مجمع وعالي الكفاءة لإحصائيات العملاء (Single Database Roundtrip)
            var totalClients = await _context.Clients.CountAsync(c => c.Role == "Client");

            var subscriptionsStats = await _context.Subscriptions
                .Where(s => (s.IsActive && s.EndDate > now) || (s.IsActive && s.EndDate.Date == today) || (!s.IsActive && s.EndDate < now))
                .Select(s => new
                {
                    s.ClientId,
                    IsActive = s.IsActive,
                    IsExpiringToday = s.IsActive && s.EndDate.Date == today,
                    IsExpiringSoon = s.IsActive && s.EndDate > now && s.EndDate <= threeDaysFromNow,
                    IsExpired = !s.IsActive && s.EndDate < now
                })
                .ToListAsync();

            var activeClients = subscriptionsStats.Where(x => x.IsActive).Select(x => x.ClientId).Distinct().Count();
            var expiringToday = subscriptionsStats.Count(x => x.IsExpiringToday);
            var expiringSoon = subscriptionsStats.Count(x => x.IsExpiringSoon);
            var expiredClients = subscriptionsStats.Count(x => x.IsExpired);

            // 📊 3. إحصائيات الباقات النشطة فقط
            var plansStats = await _context.Plans
                .Select(p => new PlanStatDto
                {
                    Name = p.Name,
                    Count = p.Subscriptions.Count(s => s.IsActive)
                })
                .Where(x => x.Count > 0)
                .ToListAsync();

            // 💰 4. تحسين الاستعلامات المالية بدمج فواتير الدفع والمصروفات
            var payments = await _context.Payments
                .Where(p => p.Status == "Completed" && (p.Date.Date == today || (p.Date.Month == now.Month && p.Date.Year == now.Year)))
                .Select(p => new { p.Amount, p.Date })
                .ToListAsync();

            var todayRevenue = payments.Where(p => p.Date.Date == today).Sum(p => p.Amount);
            var monthRevenue = payments.Sum(p => p.Amount);

            var monthExpenses = await _context.Expenses
                .Where(e => e.Date.Month == now.Month && e.Date.Year == now.Year)
                .SumAsync(e => e.Amount);

            // 🧾 5. حساب إحصائيات الفواتير المستحقة والمتأخرة باستعلام واحد مجمع
            var invoicesStats = await _context.Invoices
                .Where(i => !i.IsPaid)
                .Select(i => new { i.Total, IsOverdue = i.DueDate < now })
                .ToListAsync();

            var pendingInvoices = invoicesStats.Count(i => !i.IsOverdue);
            var overdueInvoices = invoicesStats.Count(i => i.IsOverdue);
            var overdueAmount = invoicesStats.Where(i => i.IsOverdue).Sum(i => i.Total);

            // ❌ 6. جلب آخر 5 عملاء انتهى اشتراكهم
            var expiredList = await _context.Subscriptions
                .Include(s => s.Client)
                .Include(s => s.Plan)
                .Where(s => !s.IsActive && s.EndDate < now)
                .OrderByDescending(s => s.EndDate)
                .Take(5)
                .Select(s => new ExpiredClientDto
                {
                    FullName = s.Client.FullName,
                    Username = s.Client.Username,
                    Phone = s.Client.Phone,
                    PlanName = s.Plan.Name,
                    EndDate = s.EndDate
                })
                .ToListAsync();

            // ⚠️ 7. جلب العملاء الذين سينتهي اشتراكهم قريباً
            var expiringList = await _context.Subscriptions
                .Include(s => s.Client)
                .Include(s => s.Plan)
                .Where(s => s.IsActive && s.EndDate > now && s.EndDate <= threeDaysFromNow)
                .OrderBy(s => s.EndDate)
                .Take(5)
                .Select(s => new ExpiringClientDto
                {
                    FullName = s.Client.FullName,
                    Username = s.Client.Username,
                    Phone = s.Client.Phone,
                    PlanName = s.Plan.Name,
                    EndDate = s.EndDate,
                    DaysRemaining = (s.EndDate - now).Days
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(new
            {
                clients = new
                {
                    total = totalClients,
                    active = activeClients,
                    online = onlineClients,
                    expiringToday,
                    expiringSoon,
                    expired = expiredClients
                },
                plans = plansStats,
                financial = new
                {
                    todayRevenue,
                    monthRevenue,
                    monthExpenses,
                    monthProfit = monthRevenue - monthExpenses,
                    pendingInvoices,
                    overdueInvoices,
                    overdueAmount
                },
                recent = new
                {
                    expiredClientsList = expiredList,
                    expiringSoonList = expiringList
                }
            }));
        }

        // 📈 الحصول على الإحصائيات العامة والنسب المئوية للتحويل المالي
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalRevenue = await _context.Payments
                .Where(p => p.Status == "Completed")
                .SumAsync(p => p.Amount);

            var totalExpenses = await _context.Expenses.SumAsync(e => e.Amount);
            var totalSubscriptions = await _context.Subscriptions.CountAsync();
            var activeSubscriptions = await _context.Subscriptions.CountAsync(s => s.IsActive);

            return Ok(ApiResponse<object>.Ok(new
            {
                totalRevenue,
                totalExpenses,
                totalProfit = totalRevenue - totalExpenses,
                totalSubscriptions,
                activeSubscriptions,
                conversionRate = totalSubscriptions > 0 ? (double)activeSubscriptions / totalSubscriptions * 100 : 0
            }));
        }

        // 🔔 جلب تنبيهات لوحة القيادة الفورية (الاشتراكات الفواتير، النواقص)
        [HttpGet("notifications")]
        public async Task<IActionResult> GetNotifications()
        {
            var now = DateTime.Now;
            var threeDaysFromNow = now.AddDays(3);

            var expiringSoon = await _context.Subscriptions
                .CountAsync(s => s.IsActive && s.EndDate <= threeDaysFromNow);

            var overdueInvoices = await _context.Invoices
                .CountAsync(i => !i.IsPaid && i.DueDate < now);

            var lowStockProducts = await _context.Products
                .CountAsync(p => p.Quantity <= 5);

            var notifications = new List<object>();

            if (expiringSoon > 0)
                notifications.Add(new { type = "warning", message = $"{expiringSoon} اشتراك سينتهي خلال 3 أيام", count = expiringSoon });

            if (overdueInvoices > 0)
                notifications.Add(new { type = "danger", message = $"{overdueInvoices} فاتورة متأخرة", count = overdueInvoices });

            if (lowStockProducts > 0)
                notifications.Add(new { type = "info", message = $"{lowStockProducts} منتج منخفض المخزون", count = lowStockProducts });

            return Ok(ApiResponse<object>.Ok(notifications));
        }
    }

    // 🗂️ تعاريف الـ DTOs المطلوبة للـ Strongly-Typed Mapping
    public class PlanStatDto
    {
        public string Name { get; set; }
        public int Count { get; set; }
    }

    public class ExpiredClientDto
    {
        public string FullName { get; set; }
        public string Username { get; set; }
        public string Phone { get; set; }
        public string PlanName { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class ExpiringClientDto
    {
        public string FullName { get; set; }
        public string Username { get; set; }
        public string Phone { get; set; }
        public string PlanName { get; set; }
        public DateTime EndDate { get; set; }
        public int DaysRemaining { get; set; }
    }
}