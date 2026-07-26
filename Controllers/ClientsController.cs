using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ISPSystem.Data;
using ISPSystem.DTOs;
using ISPSystem.Helpers;
using ISPSystem.Models;
using ISPSystem.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ISPSystem.Controllers
{
    [ApiController]
    [Route("api/clients")]
    [Authorize]
    public class ClientsController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly AppDbContext _context;
        private readonly AuditService _audit;
        private readonly RadiusService _radius;
        private readonly MikroTikService _mikroTik;

        public ClientsController(
            UserService userService,
            AppDbContext context,
            AuditService audit,
            RadiusService radius,
            MikroTikService mikroTik)
        {
            _userService = userService;
            _context = context;
            _audit = audit;
            _radius = radius;
            _mikroTik = mikroTik;
        }

        // 📋 الحصول على جميع العملاء + حالة الاتصال (Online/Offline)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ClientQuery query)
        {
            try
            {
                if (query.Page <= 0) query.Page = 1;
                if (query.PageSize <= 0) query.PageSize = 10;

                var clientsQuery = _context.Clients.AsQueryable();

                // بحث آمن يتعامل مع القيم null
                if (!string.IsNullOrWhiteSpace(query.Search))
                {
                    var search = query.Search.Trim();
                    clientsQuery = clientsQuery.Where(c =>
                        (c.Username != null && c.Username.Contains(search)) ||
                        (c.FullName != null && c.FullName.Contains(search)) ||
                        (c.Phone != null && c.Phone.Contains(search)) ||
                        (c.NationalId != null && c.NationalId.Contains(search))
                    );
                }

                if (!string.IsNullOrWhiteSpace(query.Status))
                {
                    clientsQuery = clientsQuery.Where(c => c.Status == query.Status);
                }

                var total = await clientsQuery.CountAsync();

                // 1. جلب العملاء من قاعدة البيانات
                var clients = await clientsQuery
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(c => new
                    {
                        c.Id,
                        c.Username,
                        c.FullName,
                        c.Phone,
                        c.Email,
                        c.MacAddress,
                        c.IpAddress,
                        c.Status,
                        c.CreatedAt,
                        c.NationalId,
                        c.Address
                    })
                    .ToListAsync();

                var clientIds = clients.Select(c => c.Id).ToList();

                // 2. جلب الاشتراكات النشطة
                var activeSubs = await _context.Subscriptions
                    .Where(s => clientIds.Contains(s.ClientId) && s.IsActive)
                    .Include(s => s.Plan)
                    .OrderByDescending(s => s.EndDate)
                    .ToListAsync();

                // 3. جلب المتصلين حالياً من MikroTik
                var onlineUsernames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                try
                {
                    var activeUsers = await _mikroTik.GetActiveUsers();
                    if (activeUsers != null)
                    {
                        foreach (var u in activeUsers)
                        {
                            if (!string.IsNullOrWhiteSpace(u.Name))
                                onlineUsernames.Add(u.Name.Trim());
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ MikroTik online check failed: {ex.Message}");
                }

                // 4. دمج النتائج
                var data = clients.Select(c =>
                {
                    var sub = activeSubs.FirstOrDefault(s => s.ClientId == c.Id);

                    return new
                    {
                        c.Id,
                        c.Username,
                        c.FullName,
                        c.Phone,
                        c.Email,
                        c.MacAddress,
                        c.IpAddress,
                        c.Status,
                        c.CreatedAt,
                        c.NationalId,
                        c.Address,
                        IsOnline = !string.IsNullOrEmpty(c.Username) && onlineUsernames.Contains(c.Username),
                        ActiveSubscription = sub == null ? null : new
                        {
                            sub.Id,
                            PlanName = sub.Plan != null ? sub.Plan.Name : "باقة غير معروفة",
                            sub.StartDate,
                            sub.EndDate,
                            sub.IsActive,
                            DaysRemaining = (sub.EndDate - DateTime.Now).Days
                        }
                    };
                }).ToList();

                return Ok(ApiResponse<object>.Ok(new
                {
                    total,
                    page = query.Page,
                    pageSize = query.PageSize,
                    data
                }));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Clients GetAll Error: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, ApiResponse<string>.Fail($"خطأ في جلب العملاء: {ex.Message}"));
            }
        }

        // 🔍 الحصول على عميل محدد
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = await _userService.GetClientById(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            // إضافة حالة الاتصال
            bool isOnline = false;
            try
            {
                var activeUsers = await _mikroTik.GetActiveUsers();
                isOnline = activeUsers?.Any(u =>
                    string.Equals(u.Name, client.Username, StringComparison.OrdinalIgnoreCase)) ?? false;
            }
            catch { }

            return Ok(ApiResponse<object>.Ok(new
            {
                client.Id,
                client.Username,
                client.FullName,
                client.Phone,
                client.Email,
                client.MacAddress,
                client.IpAddress,
                client.Address,
                client.NationalId,
                client.Status,
                client.CreatedAt,
                client.LastLogin,
                IsOnline = isOnline,
                Subscriptions = client.Subscriptions?.Select(s => new
                {
                    s.Id,
                    s.PlanId,
                    PlanName = s.Plan != null ? s.Plan.Name : null,
                    s.StartDate,
                    s.EndDate,
                    s.IsActive,
                    s.Status,
                    DaysRemaining = (s.EndDate - DateTime.Now).Days
                })
            }));
        }

        // ➕ إضافة عميل جديد
        [HttpPost]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> Create([FromBody] CreateClientDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("بيانات العميل غير صالحة"));

            try
            {
                var client = await _userService.CreateClient(dto);

                return Ok(ApiResponse<object>.Ok(new
                {
                    client = new
                    {
                        client.Id,
                        client.Username,
                        client.FullName,
                        client.Phone,
                        client.Email,
                        client.MacAddress,
                        client.IpAddress,
                        client.NationalId,
                        client.Status,
                        Password = client.Password
                    },
                    message = "تم إنشاء العميل بنجاح وإضافته إلى RADIUS"
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // 🔄 تحديث بيانات العميل
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateClientDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("البيانات المرسلة فارغة"));

            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            client.FullName = dto.FullName;
            client.Phone = dto.Phone;
            client.Email = dto.Email;
            client.Address = dto.Address;

            if (!string.IsNullOrEmpty(dto.MacAddress))
                client.MacAddress = dto.MacAddress;

            if (!string.IsNullOrEmpty(dto.IpAddress))
                client.IpAddress = dto.IpAddress;

            await _context.SaveChangesAsync();
            await _audit.Log("Update", "Client", id);

            return Ok(ApiResponse<object>.Ok(client, "تم تحديث بيانات العميل بنجاح"));
        }

        // ⛔ إيقاف العميل
        [HttpPost("{id}/suspend")]
        [Authorize(Roles = "Admin,Support,Employee")]
        public async Task<IActionResult> Suspend(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            if (client.Status == "Suspended")
                return BadRequest(ApiResponse<string>.Fail("العميل موقوف بالفعل"));

            client.Status = "Suspended";
            await _context.SaveChangesAsync();

            var radiusOk = await _radius.DisableUser(client.Username);

            try { await _mikroTik.DisablePppUser(client.Username); }
            catch { }

            await _audit.Log("Suspend", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                clientId = id,
                status = "Suspended",
                radiusDisabled = radiusOk,
                message = "تم إيقاف العميل بنجاح"
            }));
        }

        // ▶️ تفعيل العميل
        [HttpPost("{id}/activate")]
        [Authorize(Roles = "Admin,Support,Employee")]
        public async Task<IActionResult> Activate(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            if (client.Status == "Active")
                return BadRequest(ApiResponse<string>.Fail("العميل مفعّل بالفعل"));

            var hasActiveSub = await _context.Subscriptions
                .AnyAsync(s => s.ClientId == id && s.IsActive && s.EndDate > DateTime.Now);

            if (!hasActiveSub)
                return BadRequest(ApiResponse<string>.Fail("لا يمكن تفعيل العميل لأنه لا يملك اشتراكاً نشطاً"));

            client.Status = "Active";
            await _context.SaveChangesAsync();

            var radiusOk = await _radius.EnableUser(client.Username);

            try { await _mikroTik.EnablePppUser(client.Username); }
            catch { }

            await _audit.Log("Activate", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                clientId = id,
                status = "Active",
                radiusEnabled = radiusOk,
                message = "تم تفعيل العميل بنجاح"
            }));
        }

        // ❌ حذف بسيط
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            await _radius.DisableUser(client.Username);

            try { await _mikroTik.DisablePppUser(client.Username); }
            catch { }

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            await _audit.Log("Delete", "Client", id);

            return Ok(ApiResponse<string>.Ok("تم حذف العميل بنجاح"));
        }

        // 🗑️ حذف نهائي
        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePermanent(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            var username = client.Username;

            var radiusDeleted = await _radius.DeleteUser(username);

            try { await _mikroTik.RemovePppUser(username); }
            catch { }

            var subscriptions = _context.Subscriptions.Where(s => s.ClientId == id);
            _context.Subscriptions.RemoveRange(subscriptions);

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();

            await _audit.Log("DeletePermanent", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                message = "تم حذف العميل نهائياً من النظام وRADIUS وMikroTik",
                radiusDeleted
            }));
        }
    }
}