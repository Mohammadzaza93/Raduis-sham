using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ISPSystem.Data;
using ISPSystem.DTOs;
using ISPSystem.Helpers;
using ISPSystem.Models;
using ISPSystem.Services;
using System;
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
        private readonly SubscriptionService _subscriptionService;
        private readonly PasswordService _password;

        public ClientsController(
            UserService userService,
            AppDbContext context,
            AuditService audit,
            RadiusService radius,
            SubscriptionService subscriptionService,
            PasswordService password)
        {
            _userService = userService;
            _context = context;
            _audit = audit;
            _radius = radius;
            _subscriptionService = subscriptionService;
            _password = password;
        }

        // 📋 الحصول على جميع العملاء
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] ClientQuery query)
        {
            if (query.Page <= 0) query.Page = 1;
            if (query.PageSize <= 0) query.PageSize = 10;

            var clientsQuery = _context.Clients.AsQueryable();

            if (!string.IsNullOrEmpty(query.Search))
            {
                var search = query.Search.Trim();
                clientsQuery = clientsQuery.Where(c =>
                    c.Username.Contains(search) ||
                    c.FullName.Contains(search) ||
                    c.Phone.Contains(search) ||
                    c.NationalId.Contains(search));
            }

            if (!string.IsNullOrEmpty(query.Status))
            {
                clientsQuery = clientsQuery.Where(c => c.Status == query.Status);
            }

            var total = await clientsQuery.CountAsync();

            var data = await clientsQuery
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
                    ActiveSubscription = _context.Subscriptions
                        .Where(s => s.ClientId == c.Id && s.IsActive)
                        .OrderByDescending(s => s.EndDate)
                        .Select(s => new
                        {
                            s.Id,
                            PlanName = s.Plan != null ? s.Plan.Name : "باقة غير معروفة",
                            PlanSpeed = s.Plan != null ? s.Plan.Speed : null,
                            s.EndDate,
                            s.IsActive,
                            DaysRemaining = (s.EndDate - DateTime.Now).Days
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.Ok(new
            {
                total,
                page = query.Page,
                pageSize = query.PageSize,
                data
            }));
        }

        // 🔍 الحصول على عميل محدد
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var client = await _userService.GetClientById(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            return Ok(ApiResponse<object>.Ok(client));
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
                        Password = client.Password // تُعرض مرة واحدة فقط
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
            await _audit.Log("Activate", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                clientId = id,
                status = "Active",
                radiusEnabled = radiusOk,
                message = "تم تفعيل العميل بنجاح"
            }));
        }

        // 🔄 تجديد الاشتراك
        [HttpPost("{id}/renew")]
        [Authorize(Roles = "Admin,Employee,Support")]
        public async Task<IActionResult> Renew(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            try
            {
                var sub = await _subscriptionService.Renew(id);

                // تحديث تاريخ الانتهاء في RADIUS + تفعيل المستخدم
                await _radius.UpdateExpiration(client.Username, sub.EndDate);
                await _radius.EnableUser(client.Username);

                client.Status = "Active";
                await _context.SaveChangesAsync();
                await _audit.Log("Renew", "Client", id);

                return Ok(ApiResponse<object>.Ok(new
                {
                    message = "تم تجديد الاشتراك بنجاح",
                    newEndDate = sub.EndDate,
                    daysAdded = sub.Plan?.DurationDays
                }));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
        }

        // 🚀 تحديث السرعة في RADIUS
        [HttpPut("{id}/speed")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> UpdateSpeed(int id, [FromBody] UpdateSpeedDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Speed))
                return BadRequest(ApiResponse<string>.Fail("السرعة مطلوبة"));

            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            var ok = await _radius.UpdateSpeed(client.Username, dto.Speed);
            if (!ok)
                return BadRequest(ApiResponse<string>.Fail("فشل تحديث السرعة في RADIUS"));

            await _audit.Log("UpdateSpeed", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                message = "تم تحديث السرعة بنجاح في RADIUS",
                username = client.Username,
                speed = dto.Speed
            }));
        }

        // 🔑 إعادة تعيين كلمة المرور (وعرضها مرة واحدة)
        [HttpPost("{id}/reset-password")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            var client = await _context.Clients
                .Include(c => c.Subscriptions.Where(s => s.IsActive))
                .ThenInclude(s => s.Plan)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            var newPassword = ISPSystem.Helpers.RandomPasswordService.GeneratePassword(5);
            client.Password = _password.Hash(newPassword);
            await _context.SaveChangesAsync();

            // جلب السرعة وتاريخ الانتهاء الحاليين
            var activeSub = client.Subscriptions?
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefault();

            string speed = activeSub?.Plan?.Speed ?? "1M/1M";
            speed = speed.Replace("Mb/s", "M").Replace("Mbps", "M").Trim();
            if (!speed.Contains("/")) speed = $"{speed}/{speed}";

            DateTime? expiration = activeSub?.EndDate;

            // إعادة إنشاء المستخدم في RADIUS بالباسورد الجديد
            var radiusOk = await _radius.CreateUser(
                client.Username,
                newPassword,
                speed,
                expiration
            );

            await _audit.Log("ResetPassword", "Client", id);

            return Ok(ApiResponse<object>.Ok(new
            {
                message = "تم إعادة تعيين كلمة المرور بنجاح",
                username = client.Username,
                password = newPassword, // تظهر مرة واحدة فقط
                radiusUpdated = radiusOk
            }));
        }

        // ❌ حذف بسيط (من قاعدة البيانات فقط)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            await _radius.DisableUser(client.Username);

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            await _audit.Log("Delete", "Client", id);

            return Ok(ApiResponse<string>.Ok("تم حذف العميل بنجاح"));
        }

        // 🗑️ حذف نهائي (من النظام + RADIUS + كل السجلات المرتبطة)
        [HttpDelete("{id}/permanent")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePermanent(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
                return NotFound(ApiResponse<string>.Fail("العميل غير موجود"));

            var username = client.Username;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. حذف من RADIUS نهائياً
                var radiusDeleted = await _radius.DeleteUser(username);

                // 2. حذف كل السجلات المرتبطة (حسب ترتيب الاعتماديات)
                var payments = _context.Payments.Where(p => p.ClientId == id);
                _context.Payments.RemoveRange(payments);

                var invoices = _context.Invoices.Where(i => i.ClientId == id);
                _context.Invoices.RemoveRange(invoices);

                var subscriptions = _context.Subscriptions.Where(s => s.ClientId == id);
                _context.Subscriptions.RemoveRange(subscriptions);

                // إذا كان لديك جداول أخرى مرتبطة (Tickets / Devices) أضفها هنا:
                // var tickets = _context.Tickets.Where(t => t.ClientId == id);
                // _context.Tickets.RemoveRange(tickets);

                // 3. حذف العميل
                _context.Clients.Remove(client);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                await _audit.Log("DeletePermanent", "Client", id);

                return Ok(ApiResponse<object>.Ok(new
                {
                    message = "تم حذف العميل نهائياً من النظام وRADIUS",
                    radiusDeleted
                }));
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ApiResponse<string>.Fail($"فشل الحذف النهائي: {ex.Message}"));
            }
        }
    }
}